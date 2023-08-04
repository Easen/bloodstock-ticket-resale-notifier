require("console-stamp")(console);
import "dotenv/config";
import { CronJob } from "cron";
import { checkForNewTickets } from "./ticket";
import { TelegramSubscriptionBot } from "./telegram-bot";
import { getEnvVarOrError } from "./get-env-or-error";

const telegramSubscriptionBot = new TelegramSubscriptionBot();

const URL = getEnvVarOrError("URL");

async function checkForTickets() {
  console.log("checking for tickets");
  const addedTickets = await checkForNewTickets();

  const tickets = Object.entries(addedTickets).map(([key, val]) => {
    return `* ${val.name} - ${val.price}`;
  });

  if (tickets.length > 0) {
    console.log("Added tickets", { tickets });
    telegramSubscriptionBot.broadcastToAllSubscribers(
      `New tickets: \n\n ${tickets.join("\n")}\n\n${URL}`,
    );
  } else {
    console.log("No new tickets");
  }
}

const CRON_TIME = getEnvVarOrError("CRON_TIME");

const main = async () => {
  console.log("Setting up cron", { CRON_TIME });
  new CronJob(CRON_TIME, () => checkForTickets(), null, true);
};

main();
