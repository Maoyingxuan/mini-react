import { ReactElement } from "../../shared/ReactTypes";
import { createFiberFromElement } from "./ReactFiber";
import { FiberRoot,Fiber } from "./ReactInternalTypes";
import {NormalPriority, Scheduler} from '../../scheduler'
import {beginwork, updateNode} from './ReactFiberBeginWork'
import {FunctionComponent, HostComponent,HostRoot,HostText} from './ReactWorkTags'
import {Passive, Placement,Update} from './ReactFiberFlags'
import { HookFlags, HookHasEffect, HookLayout, HookPassive } from "./ReactHookEffectTags";
//current  更新完的
let workInProgress: Fiber | null = null; //正在工作当中的
let workInProgressRoot: FiberRoot | null = null;

export function updateContainer(element:ReactElement,root:FiberRoot){
    root.current.child = createFiberFromElement(element,root.current)
    root.current.child.flags = Placement
    scheduleUpdateOnFiber(root, root.current)
}
export function scheduleUpdateOnFiber(root:FiberRoot,fiber:Fiber){ //调度fiber更新
    workInProgress = fiber
    workInProgressRoot = root
    Scheduler.scheduleCallback(NormalPriority,workLoop)
}

function performUnitOfWork(unitOfWork:Fiber){
    //1. 处理当前fiber  dfs
    //2.赋值workinprogress
    // console.log(unitOfWork);
    const current = unitOfWork.alternate
    let next = beginwork(current,unitOfWork) //处理fiber,返回子节点
    if(next === null){
        //找其他节点
        completeUnitOfWork(unitOfWork)
    }else{
        workInProgress = next
    }
}
function commitRoot(){
      commitMutationEffects(workInProgressRoot.current.child, workInProgressRoot);
      const root = workInProgressRoot.current.child
      Scheduler.scheduleCallback(NormalPriority,()=>{
        flushPassiveEffects(root)
        return null
      })
      workInProgressRoot = null;
      workInProgress = null;
}
function flushPassiveEffects(finishedWork:Fiber){
  recursivelyTraversePassiveMountEffects(finishedWork);
  commitPassiveMountOnFiber(finishedWork);
}

function commitPassiveMountOnFiber(finishedWork: Fiber) {
  switch (finishedWork.tag) {
    case FunctionComponent:
      if (finishedWork.flags & Passive) {
        commitHookEffects(finishedWork, HookPassive | HookHasEffect);
      }
      finishedWork.flags &= ~Passive;
      break;
  }
}
function recursivelyTraversePassiveMountEffects(parentFiber: Fiber) {
  let child = parentFiber.child;

  while (child !== null) {
    commitPassiveMountOnFiber(child);
    child = child.sibling;
  }
}
function commitMutationEffects(finishedWork: Fiber, root: FiberRoot) {
    // switch (finishedWork.tag) {
    //   case HostComponent:
        recursivelyTraverseMutationEffects(root, finishedWork);
        commitReconciliationEffects(finishedWork);
    // }
  }
function completeUnitOfWork(unitOfWork:Fiber){
    //兄弟 - 叔叔 -爷爷
    let completeWork: Fiber = unitOfWork
    do {
        const siblingFiber = completeWork.sibling;
        // 有兄弟节点
        if (siblingFiber !== null) {
          workInProgress = siblingFiber;
          return;
        }
        const returnFiber = completeWork.return;
        completeWork = returnFiber;
        workInProgress = completeWork;
      } while (completeWork);
}
function workLoop(){
    while(workInProgress!==null){
        performUnitOfWork(workInProgress)
    }
    if(!workInProgress && workInProgressRoot){
        commitRoot()
    }
}

function recursivelyTraverseMutationEffects(
    root: FiberRoot,
    parentFiber: Fiber
  ) {
    let child = parentFiber.child;
    while (child !== null) {
      commitMutationEffects(child, root);
      child = child.sibling;
    }
  }

// fiber.flags
// 新增插入、移动位置、更新属性 ++ 删除属性
function commitReconciliationEffects(finishedWork: Fiber) {
    const flags = finishedWork.flags;
    if (flags & Placement) {
      commitPlacement(finishedWork);
      finishedWork.flags &= ~Placement;
    }
    if(flags & Update){
      switch(finishedWork.tag){
        case HostComponent:
        if(finishedWork.stateNode && finishedWork.tag === HostComponent){
        updateNode(finishedWork.stateNode,finishedWork.alternate.pendingProps,finishedWork.pendingProps)
      }
      break
        case FunctionComponent:
          commitHookEffects(finishedWork, HookLayout)
      }
      
      finishedWork.flags &= ~Placement;

    }
    if (finishedWork.deletions) {
      // parentFiber 是 deletions 的父dom节点对应的fiber
      const parentFiber = isHostParent(finishedWork)
        ? finishedWork
        : getHostParentFiber(finishedWork);
      const parent = parentFiber.stateNode;
      commitDeletions(finishedWork.deletions, parent);
      finishedWork.deletions = null;
    }
  }
  function commitHookEffects(finishedWork: Fiber, hookFlags: HookFlags) {
    const updateQueue = finishedWork.updateQueue;
    const lastEffect = updateQueue != null ? updateQueue.lastEffect : null;
    if (lastEffect) {
      const firstEffect = lastEffect.next;
      let effect = firstEffect;
  
      do {
        if ((effect.tag & hookFlags) === hookFlags) {
          const create = effect.create;
          effect.destroy = create();
          // create()
        }
        effect = effect.next;
      } while (effect !== firstEffect);
    }
  }
  function commitDeletions(deletions: Array<Fiber>, parent: Element) {
    deletions.forEach((deletion) => {
      // 找到deletion的dom节点
      parent.removeChild(getStateNode(deletion));
    });
  }
  function getStateNode(fiber: Fiber) {
    let node = fiber;
  
    while (1) {
      if (isHost(node) && node.stateNode) {
        return node.stateNode;
      }
      node = node.child;
    }
  }
  // 原生节点：原生标签、文本节点
function isHost(fiber: Fiber) {
  return fiber.tag === HostComponent || fiber.tag === HostText;
}

  function commitPlacement(finishedWork: Fiber) {
    const parentFiber = getHostParentFiber(finishedWork);
  
    // 插入父dom
    if (
      finishedWork.stateNode &&
      (finishedWork.tag === HostText || finishedWork.tag === HostComponent)
    ) {
      // 获取父dom节点
      let parent = parentFiber.stateNode;
  
      if (parent.containerInfo) {
        parent = parent.containerInfo;
      }
  
      // dom节点
      const before = getHostSibling(finishedWork);
      insertOrAppendPlacementNode(finishedWork, before, parent);
      // parent.appendChild(finishedWork.stateNode);
    }
  }
  
function getHostParentFiber(fiber:Fiber):Fiber{
  let parent = fiber.return
  while(parent!==null){
    if(isHostParent(parent)){
      return parent
    }else{
      parent = parent.return
    }
  }
}
//返回fiber的下一个兄弟节点
function getHostSibling(fiber: Fiber) {
  let node = fiber;

  sibling: while (1) {
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node.return)) {
        return null;
      }
      node = node.return;
    }

    node.sibling.return = node.return;
    node = node.sibling;

    while (node.tag !== HostComponent && node.tag !== HostText) {
      if (node.flags & Placement) {
        // Placement表示节点是新增插入或者移动位置
        continue sibling;
      }

      if (node.child === null) {
        continue sibling;
      } else {
        node.child.return = node;
        node = node.child;
      }
    }

    if (!(node.flags & Placement)) {
      return node.stateNode;
    }
  }
}
function isHostParent(fiber:Fiber):boolean{
  return fiber.tag === HostComponent || fiber.tag === HostRoot;
}
function insertOrAppendPlacementNode(node:Fiber,before:Element,parent:Element):void{
  const {tag} = node;
  const isHost = tag === HostComponent || HostText;
  if (isHost) {
    const stateNode = node.stateNode;
    if (before) {
      parent.insertBefore(stateNode, before);
    } else {
      parent.appendChild(stateNode);
    }
  } else {
    const child = node.child;
    if (child !== null) {
      insertOrAppendPlacementNode(child, before, parent);
      let sibling = child.sibling;
      while (sibling !== null) {
        insertOrAppendPlacementNode(sibling, before, parent);
        sibling = sibling.sibling;
      }
    }
  }
}