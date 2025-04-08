import type {WorkTag} from "./ReactWorkTags";
import type {Flags} from "./ReactFiberFlags";
// import type {LaneMap, Lanes, Lane} from "../src-tem/ReactFiberLane";

export type Fiber = {
  tag: WorkTag;
  key: null | string;
  elementType: any;
  type: any;
  stateNode: any;
  return: Fiber | null;
  child: Fiber | null;
  sibling: Fiber | null;
  index: number;
  pendingProps: any;  
  memoizedProps: any; 
  updateQueue: any;
  memoizedState: any;
  flags: Flags;
  subtreeFlags: Flags;
  deletions: Array<Fiber> | null;
  nextEffect: Fiber | null;
  alternate: Fiber | null;
};

export type Container =
  | (Element & {_reactRootContainer?: FiberRoot})
  | (Document & {_reactRootContainer?: FiberRoot})
  | (DocumentFragment & {_reactRootContainer?: FiberRoot});

export type FiberRoot = {
  containerInfo: Container;
  current: Fiber;
  finishedWork: Fiber | null;
  timeoutHandle: number;
  callbackNode: any;
};