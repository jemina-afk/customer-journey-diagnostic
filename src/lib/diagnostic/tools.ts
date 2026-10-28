import raw from "../../../content/tools.json";

/*
  Tools suggested in the report. The list itself lives in content/tools.json so
  it can be edited without touching code; this file only gives it a shape and a
  safe lookup. No prices and no affiliate links, by design: the report
  recommends a category and names products that are well established in it.
*/

export interface Tool {
  name: string;
  what: string;
}

export interface StageTools {
  /** Free, or already in their hands. */
  startHere: string[];
  /** Well-established products, named without prices. */
  market: Tool[];
  /** One line on how the pieces join up. */
  joinedUp: string;
}

const STAGE_TOOLS = raw.stages as Record<string, StageTools>;

export const CONNECTORS = raw.connectors as Tool[];

export function toolsFor(stageId: string): StageTools {
  return (
    STAGE_TOOLS[stageId] ?? { startHere: [], market: [], joinedUp: "" }
  );
}
