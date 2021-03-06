// Copyright: Ankitects Pty Ltd and contributors
// License: GNU AGPL, version 3 or later; http://www.gnu.org/licenses/agpl.html

/* eslint
@typescript-eslint/no-non-null-assertion: "off",
@typescript-eslint/no-explicit-any: "off",
@typescript-eslint/ban-ts-ignore: "off" */

import pb from "../backend/proto";
import { Selection } from "d3-selection";

async function fetchData(search: string, days: number): Promise<Uint8Array> {
    const resp = await fetch("/_anki/graphData", {
        method: "POST",
        body: JSON.stringify({
            search,
            days,
        }),
    });
    if (!resp.ok) {
        throw Error(`unexpected reply: ${resp.statusText}`);
    }
    // get returned bytes
    const respBlob = await resp.blob();
    const respBuf = await new Response(respBlob).arrayBuffer();
    const bytes = new Uint8Array(respBuf);
    return bytes;
}

export async function getGraphData(
    search: string,
    days: number
): Promise<pb.BackendProto.GraphsOut> {
    const bytes = await fetchData(search, days);
    return pb.BackendProto.GraphsOut.decode(bytes);
}

// amount of data to fetch from backend
export enum RevlogRange {
    Year = 1,
    All = 2,
}

// period a graph should cover
export enum GraphRange {
    Month = 0,
    ThreeMonths = 1,
    Year = 2,
    AllTime = 3,
}

export interface GraphsContext {
    cards: pb.BackendProto.Card[];
    revlog: pb.BackendProto.RevlogEntry[];
    revlogRange: RevlogRange;
    nightMode: boolean;
}

export interface GraphBounds {
    width: number;
    height: number;
    marginLeft: number;
    marginRight: number;
    marginTop: number;
    marginBottom: number;
}

export function defaultGraphBounds(): GraphBounds {
    return {
        width: 600,
        height: 250,
        marginLeft: 70,
        marginRight: 70,
        marginTop: 20,
        marginBottom: 25,
    };
}

export function setDataAvailable(
    svg: Selection<SVGElement, any, any, any>,
    available: boolean
): void {
    svg.select(".no-data")
        .attr("pointer-events", available ? "none" : "all")
        .transition()
        .duration(600)
        .attr("opacity", available ? 0 : 1);
}

export function millisecondCutoffForRange(
    range: GraphRange,
    nextDayAtSecs: number
): number {
    let days;
    switch (range) {
        case GraphRange.Month:
            days = 31;
            break;
        case GraphRange.ThreeMonths:
            days = 90;
            break;
        case GraphRange.Year:
            days = 365;
            break;
        case GraphRange.AllTime:
        default:
            return 0;
    }

    return (nextDayAtSecs - 86400 * days) * 1000;
}

export interface TableDatum {
    label: string;
    value: string;
}
