import {createFiberFromElement} from "./ReactFiber";
import { Fiber } from "./ReactInternalTypes";
import { FunctionComponent, HostComponent, HostRoot } from "./ReactWorkTags";
import {Placement} from "./ReactFiberFlags";
import {isStr} from "../../shared/utils";
export function beginwork (current:Fiber|null,workInProgress:Fiber) { //处理fiber,返回子节点
    switch(workInProgress.tag){
        case HostRoot:
            return updateHostRoot(current,workInProgress)
        case HostComponent:
            return updateHostComponent(current,workInProgress)
        case FunctionComponent:
          return updateFunctionComponent(current,workInProgress)
    }
}
function updateHostRoot(current:Fiber|null,workInProgress:Fiber){
    return workInProgress.child
}
function updateHostComponent(current:Fiber|null,workInProgress:Fiber){
    const {type} = workInProgress
    if(!workInProgress.stateNode){
        workInProgress.stateNode = document.createElement(type)
        //更新属性
        updateNode(workInProgress.stateNode, workInProgress.pendingProps);
    }
    //返回子节点，此时是数组，需要创造成fiber单链表
    let nextChildren = workInProgress.pendingProps.children
    const isdirectTextChild = shouldSetTextContent(type,workInProgress.pendingProps)
    if(isdirectTextChild){
        nextChildren = null
        return null
    }
    workInProgress.child = reconcileChildren(current,workInProgress,nextChildren)
    console.log(
        "%c [  ]-47",
        "font-size:13px; background:pink; color:#bf2c9f;",
        workInProgress
      );
      return workInProgress.child;
}
function updateFunctionComponent(current:Fiber|null,workInProgress:Fiber):Fiber|null{
  const {type,pendingProps} = workInProgress
  const chindren = type(pendingProps)
  workInProgress.child = reconcileChildren(current,workInProgress,chindren)
  return workInProgress.child

}
function reconcileChildren(current:Fiber|null,workInProgress:Fiber,nextChildren:any):Fiber|null{
    //返回child (第一个子fiber) + 构建Fiber
    const newChildren = Array.isArray(nextChildren)
    ? nextChildren
    : [nextChildren];

  let newIndex = 0;
  let resultingFirstChild = null;
  let previousNewFiber = null;
  for (; newIndex < newChildren.length; newIndex++) {
    const newChild = newChildren[newIndex];
    if (newChild == null) {
      continue;
    }

    const newFiber = createFiberFromElement(newChild, workInProgress);

    // 初次渲染
    newFiber.flags = Placement;
    if (previousNewFiber === null) {
      resultingFirstChild = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }
    previousNewFiber = newFiber;
  }

  return resultingFirstChild;
}

function shouldSetTextContent(type: string, props: any): boolean {
    return (
      type === "textarea" ||
      type === "noscript" ||
      typeof props.children === "string" ||
      typeof props.children === "number" ||
      (typeof props.dangerouslySetInnerHTML === "object" &&
        props.dangerouslySetInnerHTML !== null &&
        props.dangerouslySetInnerHTML.__html != null)
    );
  }
function updateNode(dom:any,nextVal:any){
    Object.keys(nextVal).forEach((k)=>{
        if (k === "children") {
            // 子节点、文本
            if (isStr(nextVal[k])) {
              dom.textContent = nextVal[k];
            }
          } else {
            // 普通属性，不包括style
            dom[k] = nextVal[k];
          }
    })
}


