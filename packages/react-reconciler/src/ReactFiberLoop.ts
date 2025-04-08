import { ReactElement } from "../../shared/ReactTypes";
import { createFiberFromElement } from "./ReactFiber";
import { FiberRoot,Fiber } from "./ReactInternalTypes";
import {NormalPriority, Scheduler} from '../../scheduler'
import {beginwork} from './ReactFiberBeginWork'
import {HostComponent} from './ReactWorkTags'
import {Placement} from './ReactFiberFlags'
//current  更新完的
let workInProgress: Fiber | null = null; //正在工作当中的
let workInProgressRoot: FiberRoot | null = null;

export function updateContainer(element:ReactElement,root:FiberRoot){
    root.current.child = createFiberFromElement(element,root.current)
    scheduleUpdateOnFiber(root, root.current)
}
function scheduleUpdateOnFiber(root:FiberRoot,fiber:Fiber){ //调度fiber更新
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
    workInProgressRoot.containerInfo.appendChild(
        workInProgressRoot.current.child.stateNode
      );
    
      commitMutationEffects(workInProgressRoot.current.child, workInProgressRoot);
    
      workInProgressRoot = null;
      workInProgress = null;
}
function commitMutationEffects(finishedWork: Fiber, root: FiberRoot) {
    switch (finishedWork.tag) {
      case HostComponent:
        recursivelyTraverseMutationEffects(root, finishedWork);
        commitReconciliationEffects(finishedWork);
    }
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
// 新增插入、移动位置、更新属性
function commitReconciliationEffects(finishedWork: Fiber) {
    const flags = finishedWork.flags;
    if (flags & Placement) {
      commitPlacement(finishedWork);
      finishedWork.flags &= ~Placement;
    }
  }
function commitPlacement(finishedWork:Fiber){
    //Dom上子节点插入父节点
    const parentFiber = finishedWork.return;
    // 获取父dom节点
    const parent = parentFiber.stateNode;
    if (finishedWork.stateNode) {
      parent.appendChild(finishedWork.stateNode);
    }
}