import { HookFlags, HookHasEffect, HookLayout, HookPassive } from './ReactHookEffectTags';
import {scheduleUpdateOnFiber} from './ReactFiberLoop'
import { Fiber, FiberRoot } from './ReactInternalTypes';
import { HostRoot } from './ReactWorkTags';
import { isFn } from '../../shared/utils';
import { Flags, Update as updateEffect, Passive as passiveEffect } from './ReactFiberFlags';
//获取当前正在执行的函数组件Fiber
type Hook = {
    memorizedState: any,
    next: Hook | null
}
type Effect = {
  tag: HookFlags;
  create: () => (() => void) | void;
  deps: Array<unknown> | void | null;
  next: Effect | null;
};
let currentRenderingFiber:Fiber|null = null
let workInProgressHook:Hook|null = null
let currentHook: Hook = null
export function renderHooks(workInProgress:Fiber){
    currentRenderingFiber = workInProgress
    currentRenderingFiber.updateQueue = null
    workInProgressHook = null
}
//获取当前hook
function updateWorkInProgress():Hook{
    let hook: Hook
    const current = currentRenderingFiber.alternate
    if(current){ //更新
        currentRenderingFiber.memoizedState = current.memoizedState;
        if (workInProgressHook) {
            // 不是第一个hook
           workInProgressHook = hook = workInProgressHook.next;
           currentHook = currentHook.next
          } else {
            // 是第一个hook
            hook = workInProgressHook = currentRenderingFiber.memoizedState;
            currentHook = current.memoizedState
          }
    }else{ //初次渲染
        currentHook = null
        hook = {
            memorizedState: null, //状态值
            next: null, // 指向下一个hook或者null
          };
          if (workInProgressHook) {
            // 不是第一个hook
            workInProgressHook = workInProgressHook.next = hook;
          } else {
            // 是第一个hook
            workInProgressHook = currentRenderingFiber.memoizedState = hook;
          }
    }
    return hook
}
export function useReducer(reducer: Function, initialState: any) {
  const hook = updateWorkInProgress();
  // console.log(hook);
  if (!currentRenderingFiber.alternate) {
    // 函数组件初次渲染
    hook.memorizedState = initialState;
  }
  const dispatch = (action) => {
    hook.memorizedState = reducer ? reducer(hook.memorizedState, action) : action;

    const root = getRootForFiber(currentRenderingFiber);

    currentRenderingFiber.alternate = {...currentRenderingFiber};

    scheduleUpdateOnFiber(root, currentRenderingFiber);
  };
  // console.log(hook);
  return [hook.memorizedState, dispatch];
}
export function useState(initialState: any) {
  return useReducer(null, isFn(initialState) ? initialState() : initialState);
}
function getRootForFiber(sourceFiber:Fiber):FiberRoot{    
    let node = sourceFiber
    let parent = node.return
    while(parent!==null){
        node = parent
        parent = node.return
    }
    return node.tag == HostRoot? node.stateNode:null
}

export function useEffect(
  create: () => void | void,
  deps: Array<unknown> | void | null
){
  return updateEffectImpl(passiveEffect,HookPassive,create,deps)
}
export function useLayoutEffect(
  create: () => void | void,
  deps: Array<unknown> | void | null
){
  return updateEffectImpl(updateEffect,HookLayout,create,deps)
}
function updateEffectImpl(  
  fiberFlags: Flags,
  hookFlags: HookFlags,
  create: () => (() => void) | void,
  deps: Array<unknown> | void | null){
    const hook = updateWorkInProgress();

    const nextDeps = deps === undefined ? null : deps;
  
    if (currentHook) {
      // 检查deps的变化
      const prevEffect = currentHook.memorizedState;
  
      if (deps) {        
        const prevDeps = prevEffect.deps;
        console.log(prevDeps,prevEffect.deps);
        
        if (areHookInputsEqual(deps, prevDeps)) {
          // console.log('没变');
          return;
        }
      }
    }
    currentRenderingFiber.flags |= fiberFlags;
    hook.memorizedState = pushEffect(HookHasEffect | hookFlags, create, nextDeps);
}

function pushEffect(
  tag: HookFlags,
  create: () => (() => void) | void,
  deps: Array<unknown> | void | null
) {
  const effect: Effect = {
    tag,
    create,
    deps,
    next: null,
  };

  // 单向循环链表
  let componentUpdateQueue = currentRenderingFiber.updateQueue;

  if (componentUpdateQueue === null) {
    // 第一个effect
    componentUpdateQueue = {lastEffect: null};
    currentRenderingFiber.updateQueue = componentUpdateQueue;
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    // 在原先的 effect 后面累加
    const lastEffect = componentUpdateQueue.lastEffect;
    const firstEffect = lastEffect.next;
    lastEffect.next = effect;
    effect.next = firstEffect;
    componentUpdateQueue.lastEffect = effect;
  }

  return effect;
}
export function areHookInputsEqual(
  nextDeps: Array<unknown>,
  prevDeps: Array<unknown> | null
): boolean {
  if (prevDeps === null) {
    return false;
  }

  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }
  return true;
}
