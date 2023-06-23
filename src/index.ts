import * as HtmlParser2 from "htmlparser2";
import { Element, Text } from "domhandler";
import * as CssSelect from 'css-select';
import { readFileSync, writeFileSync } from 'fs';
import { addedDiff } from 'deep-object-diff';

import 'dotenv/config'

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

const URL = getEnvVarOrError('URL');
const STATE = getEnvVarOrError('STATE');

function readState() {
    let state = {};
    try {
        state = JSON.parse(readFileSync(STATE).toString());
    } catch (err) {
        writeFileSync(STATE, JSON.stringify(state));
    }
    return state;
}

const main = async () => {
    const state = readState();

    const tickets: Ticket[] = await fetchTickets(URL);

    const addedTickets = Object.entries(addedDiff(state, tickets))
        .map(([key, val]) => {
            return `${val.name} - ${val.price}`;
        });
    console.log(addedTickets);

    // writeState(tickets);
};

main();

function writeState(tickets: Ticket[]) {
    writeFileSync(STATE, JSON.stringify(tickets));
}

function getEnvVarOrError(envVar: string): string {
    const val = process.env[envVar];
    if (!val) {
        throw new Error(`Missing env var ${envVar}`);
    }
    return val;
}

