import {createFiberFromElement, createFiberFromText} from "./ReactFiber";
import { Fiber } from "./ReactInternalTypes";
import { ClassComponent, Fragment, FunctionComponent, HostComponent, HostRoot, HostText } from "./ReactWorkTags";
import {Placement} from "./ReactFiberFlags";
import {isNum, isStr} from "../../shared/utils";
import {renderHooks} from "./ReactFiberHooks"
import {reconcileChildren} from "./ReactChildFiber"
export function beginwork (current:Fiber|null,workInProgress:Fiber) { //处理fiber,返回子节点
    switch(workInProgress.tag){
        case HostRoot:
            return updateHostRoot(current,workInProgress)
        case HostComponent:
            return updateHostComponent(current,workInProgress)
        case FunctionComponent:
          return updateFunctionComponent(current,workInProgress)
          case ClassComponent:
            return updateClassComponent(current,workInProgress)
          case HostText:
            return updateHostText(current,workInProgress)
          case Fragment:
            return updateFragment(current,workInProgress)
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
        updateNode(workInProgress.stateNode,{}, workInProgress.pendingProps);
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
  renderHooks(workInProgress)
  const {type,pendingProps} = workInProgress
  const children = type(pendingProps)
  workInProgress.child = reconcileChildren(current,workInProgress,children)
  return workInProgress.child
}
function updateClassComponent(current:Fiber|null,workInProgress:Fiber):Fiber|null{
  const {type,pendingProps} = workInProgress
  const instance = new type(pendingProps)
  workInProgress.stateNode = instance
  const children = instance.render()
  workInProgress.child = reconcileChildren(current,workInProgress,children)
  return workInProgress.child
}
function updateHostText(current:Fiber|null,workInProgress:Fiber):Fiber|null{
  const {pendingProps} = workInProgress;
  if (!workInProgress.stateNode) {
    workInProgress.stateNode = document.createTextNode(pendingProps);
  }
  return null;
}
function updateFragment(current:Fiber|null,workInProgress:Fiber):Fiber|null{
  workInProgress.child = reconcileChildren(
    current,
    workInProgress, 
    workInProgress.pendingProps.children)
  return workInProgress.child
}
// function _reconcileChildren(current:Fiber|null,workInProgress:Fiber,nextChildren:any):Fiber|null{
//     //返回child (第一个子fiber) + 构建Fiber
//     const newChildren = Array.isArray(nextChildren)
//     ? nextChildren
//     : [nextChildren];

//   let newIndex = 0;
//   let resultingFirstChild:Fiber|null = null;
//   let previousNewFiber:Fiber|null = null;
//   for (; newIndex < newChildren.length; newIndex++) {
//     const newChild = newChildren[newIndex];
//     if (newChild == null) {
//       continue;
//     }

//     // const newFiber = createFiberFromElement(newChild, workInProgress);
//     let newFiber: Fiber
//     if(isStr(newChild)){
//       newFiber = createFiberFromText(newChild, workInProgress)
//     }else{
//       newFiber = createFiberFromElement(newChild, workInProgress)
//     }
//     // 初次渲染
//     newFiber.flags = Placement;
//     if (previousNewFiber === null) {
//       resultingFirstChild = newFiber;
//     } else {
//       previousNewFiber.sibling = newFiber;
//     }
//     previousNewFiber = newFiber;
//   }

//   return resultingFirstChild;
// }

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
  export function updateNode(node, prevVal, nextVal) {
    Object.keys(prevVal)
      // .filter(k => k !== "children")
      .forEach((k) => {
        if (k === "children") {
          // 有可能是文本
          if (isStr(nextVal[k]) || isNum(nextVal[k])) {
            node.textContent = "";
          }
        } else if (k.slice(0, 2) === "on") {
          const eventName = k.slice(2).toLocaleLowerCase();
          node.removeEventListener(eventName, prevVal[k]);
        } else {
          if (!(k in nextVal)) {
            node[k] = "";
          }
        }
      });
  
    Object.keys(nextVal)
      // .filter(k => k !== "children")
      .forEach((k) => {
        if (k === "children") {
          // 有可能是文本
          if (isStr(nextVal[k]) || isNum(nextVal[k])) {
            node.textContent = nextVal[k] + "";
          }
        } else if (k.slice(0, 2) === "on") {
          const eventName = k.slice(2).toLocaleLowerCase();
          node.addEventListener(eventName, nextVal[k]);
        } else {
          node[k] = nextVal[k];
        }
      });
  }


