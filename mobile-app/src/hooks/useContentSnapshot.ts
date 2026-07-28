import { useEffect, useState } from "react";
import { getContentSnapshot, subscribeToContentUpdates } from "../services/contentUpdateService";

export function useContentSnapshot() {
  const [snapshot, setSnapshot] = useState(getContentSnapshot);
  useEffect(() => subscribeToContentUpdates(() => setSnapshot(getContentSnapshot())), []);
  return snapshot;
}
