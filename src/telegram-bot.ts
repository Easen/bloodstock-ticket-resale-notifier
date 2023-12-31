import TelegramBot from "node-telegram-bot-api";
import { getEnvVarOrError } from "./get-env-or-error";
import { readState, writeState } from "./state";

const TELEGRAM_BOT_TOKEN = getEnvVarOrError("TELEGRAM_BOT_TOKEN");
const TELEGRAM_STATE_FILE = getEnvVarOrError("TELEGRAM_STATE_FILE");
const TELEGRAM_ADMIN_CHAT_ID = Number.parseInt(
  getEnvVarOrError("TELEGRAM_ADMIN_CHAT_ID"),
);

interface TelegramState {
  subscriptions: number[];
}

const telegramState = readState<TelegramState>(TELEGRAM_STATE_FILE, {
  subscriptions: [],
});

export class TelegramSubscriptionBot {
  private bot: TelegramBot;
  constructor() {
    this.bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
    this.setupHandlers();
  }

  private setupHandlers() {
    this.bot.onText(/\/start/, (msg) => {
      console.log("TelegramSubscriptionBot - /start", { msg });
      const chatId = msg.chat.id;
      if (!telegramState.subscriptions.includes(chatId)) {
        telegramState.subscriptions.push(chatId);
        writeState(TELEGRAM_STATE_FILE, telegramState);
        this.bot.sendMessage(chatId, "Started - to stop reply with /stop");
      }
    });

    this.bot.onText(/\/stop/, (msg) => {
      console.log("TelegramSubscriptionBot - /stop", { msg });
      const chatId = msg.chat.id;
      if (telegramState.subscriptions.includes(chatId)) {
        telegramState.subscriptions = telegramState.subscriptions.filter(
          (x) => x != chatId,
        );
        writeState(TELEGRAM_STATE_FILE, telegramState);
        this.bot.sendMessage(chatId, "Stopped - to start reply with /start");
      }
    });

    this.bot.onText(/\/shutdown/, async (msg) => {
      console.log("TelegramSubscriptionBot - /shutdown", { msg });
      if (TELEGRAM_ADMIN_CHAT_ID == msg.chat.id) {
        await this.broadcastToAllSubscribers(
          "This bot has been shutdown. You have been unsubscribed.",
        );
        telegramState.subscriptions = [];
        writeState(TELEGRAM_STATE_FILE, telegramState);
      }
    });

    this.bot.setMyCommands([
      { command: "/start", description: "Subscribe" },
      { command: "/stop", description: "Stop" },
    ]);
  }

  public broadcastToAllSubscribers(message: string) {
    console.log(`TelegramSubscriptionBot.broadcastToAllSubscribers()`, message);
    return Promise.all(
      telegramState.subscriptions.map((chatId) =>
        this.bot.sendMessage(chatId, message),
      ),
    );
  }
}
