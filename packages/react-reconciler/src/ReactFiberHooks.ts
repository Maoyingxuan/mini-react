// import { useReducer } from 'react';
import {scheduleUpdateOnFiber} from './ReactFiberLoop'
import { Fiber, FiberRoot } from './ReactInternalTypes';
import { HostRoot } from './ReactWorkTags';
import { isFn } from '../../shared/utils';
//获取当前正在执行的函数组件Fiber
type Hook = {
    memorizedState: any,
    next: Hook | null
}
let currentRenderingFiber:Fiber|null = null
let workInProgressHook:Hook|null = null
export function renderHooks(workInProgress:Fiber){
    currentRenderingFiber = workInProgress
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
          } else {
            // 是第一个hook
            hook = workInProgressHook = currentRenderingFiber.memoizedState;
          }
    }else{ //初次渲染
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