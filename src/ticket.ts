import { getEnvVarOrError } from "./get-env-or-error";
import { readState, writeState } from "./state";
import * as HtmlParser2 from "htmlparser2";
import { Element, Text } from "domhandler";
import * as CssSelect from 'css-select';

const URL = getEnvVarOrError('URL');
const PREVIOUS_TICKETS_FILE = getEnvVarOrError('PREVIOUS_TICKETS_FILE');

function arrayDifferences(original: unknown[], updated: unknown[]): Ticket[] {
    const originalJson = original.map(x => JSON.stringify(x));
    const updatedJson = updated.map(x => JSON.stringify(x));
    return updatedJson.filter(x => !originalJson.includes(x))
        .map(x => JSON.parse(x));
}


export async function checkForNewTickets(): Promise<Record<string, Partial<Ticket>>> {
    const state = readState<Ticket[]>(PREVIOUS_TICKETS_FILE);
    const tickets: Ticket[] = await fetchTickets(URL);
    writeState(PREVIOUS_TICKETS_FILE, tickets);
    return arrayDifferences(state, tickets) as unknown as Record<string, Partial<Ticket>>;
}

interface Ticket {
    name: String;
    price: String
}

async function fetchTickets(url: string): Promise<Ticket[]> {
    const html = await fetchHtml(url);
    const doc = HtmlParser2.parseDocument(html);
    const el = CssSelect.selectAll('table.price-list.see-table.one-group-top tr.ticket', doc);
    const tickets: Ticket[] = el.map(el => {
        const text = el.children.filter(x => x instanceof Element)
            .map(x => (x as unknown as Element).children)
            .map(td => td.filter(el => el instanceof Text))
            .map(textEl => (textEl as Text[])
                .map(textEl => textEl.data)
                .join())
            .map(text => text.replace(/[\n\r,]+/g, '').trim());
        return { name: text[0], price: text[1] };
    });
    return tickets;
}

async function fetchHtml(url: string): Promise<string> {
    const res = await fetch(url);
    return await res.text();
}


