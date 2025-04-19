import { Fiber } from "./ReactInternalTypes";
import { isStr } from "../../shared/utils";
import { createFiberFromElement,createFiberFromText } from "./ReactFiber";
import { Update, Placement } from "./ReactFiberFlags";
//初次渲染
//更新
export function reconcileChildren(current:Fiber|null,returnFiber:Fiber,nextChildren:any):Fiber|null{
    //返回child (第一个子fiber) + 构建Fiber
    const newChildren = Array.isArray(nextChildren)
    ? nextChildren
    : [nextChildren];
  let newIndex = 0;
  let nextOldFiber:Fiber|null = null
  let resultingFirstChild:Fiber|null = null;
  let previousNewFiber:Fiber|null = null; 
  let oldFiber:Fiber|null = returnFiber.alternate?returnFiber.alternate.child:null
  //记录上次节点插入位置，判断节点位置是否发生变化
  // 0 1 2 10 5
  let lastPlacedIndex = 0
  //是否是组件更新
  const shouldTrackSideEffects = !! returnFiber.alternate
  //1.比较新老节点，如果可以复用，继续往右否则停止
  for(; oldFiber && (newIndex < newChildren.length);newIndex++){
    // console.log('step1');
    const newChild = newChildren[newIndex]
    if(newChild == null){
      continue
    }
    if(oldFiber.index > newIndex){
      //相对位置不对了
      nextOldFiber = oldFiber
      oldFiber = null
    }else{
      nextOldFiber = oldFiber.sibling
    }
    // console.log(newChild,oldFiber)
    // console.log(sameNode(newChild,oldFiber));
    if(!sameNode(newChild,oldFiber)){
      if(oldFiber == null){
        oldFiber = nextOldFiber
      }
      break
    }
    let newFiber: Fiber
    if(isStr(newChild)){
     newFiber = createFiberFromText(newChild, returnFiber)
        }else{
          newFiber = createFiberFromElement(newChild, returnFiber)
      }
      lastPlacedIndex = placeChild(
        newFiber,
        lastPlacedIndex,
        newIndex,
        shouldTrackSideEffects
      )
      Object.assign(newFiber,{
        stateNode: oldFiber?.stateNode,
        alternate:oldFiber,
        flags:Update
      })
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber
  }
  //2.新节点没了，删老节点
  if(newIndex == newChildren.length){
    // console.log('step2');
    deleteRemainingChildren(returnFiber,oldFiber)
    return resultingFirstChild
  }
  //3.老节点没了，插入新节点（初次渲染）
  if (!oldFiber) {
    // console.log('step3');
    for (; newIndex < newChildren.length; newIndex++) {
      const newChild = newChildren[newIndex];
      if (newChild == null) {
        continue;
      }
      let newFiber: Fiber;
      if (isStr(newChild)) {
        newFiber = createFiberFromText(newChild, returnFiber);
      } else {
        newFiber = createFiberFromElement(newChild, returnFiber);
      }
      newFiber.flags = Placement;
      lastPlacedIndex = placeChild(
        newFiber,
        lastPlacedIndex,
        newIndex,
        shouldTrackSideEffects
      );
      if (previousNewFiber === null) {
        // head node
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }

      previousNewFiber = newFiber;
    }
  }
  //4. 新老节点都还有
  //4.1 剩余old节点构建成单链表
  const existingChildren = mapRemainingChildren(oldFiber);
  //4.2 遍历新节点，通过新节点的key去哈希表中查找节点，找到就复用节点，并且删除哈希表中对应的节点
  for (; newIndex < newChildren.length; newIndex++) {
    // console.log('step4');
    const newChild = newChildren[newIndex];
    if (newChild == null) {
      continue;
    }
    // const newFiber = createFiber(newChild, returnFiber);
    let newFiber: Fiber;
    if (isStr(newChild)) {
      newFiber = createFiberFromText(newChild, returnFiber);
    } else {
      newFiber = createFiberFromElement(newChild, returnFiber);
    }
    // oldFiber
    const matchedFiber = existingChildren.get(newFiber.key || newIndex);
    if (matchedFiber) {
      // 节点复用
      Object.assign(newFiber, {
        stateNode: matchedFiber.stateNode,
        alternate: matchedFiber,
        flags: Update,
      });

      existingChildren.delete(newFiber.key || newIndex);
    }
    else{
      newFiber.flags = Placement
    }

    lastPlacedIndex = placeChild(
      newFiber,
      lastPlacedIndex,
      newIndex,
      shouldTrackSideEffects
    );

    if (previousNewFiber == null) {
      resultingFirstChild = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }
    previousNewFiber = newFiber;
}
//5 old的哈希表中还有值，遍历哈希表删除所有old
if (shouldTrackSideEffects) {
  // console.log('step5');
  existingChildren.forEach((child) => deleteChild(returnFiber, child));
}
  return resultingFirstChild 
}

//判断是否是同一个节点，是则可以复用
function sameNode (a,b){
  return a.type === b.type && a.key === b.key
}
//初次渲染记录下标
//更新检查节点是否移动,记录newfiber的位置
function placeChild(
  newFiber:Fiber,
  lastPlacedIndex:number,
  newIndex:number,
  shouldTrackSideEffects:boolean
):number {
  newFiber.index = newIndex;
  if (!shouldTrackSideEffects) {
    // 父节点初次渲染
    return lastPlacedIndex;
  }
  // 父节点更新
  // 子节点是初次渲染还是更新呢
  const current = newFiber.alternate;
  if (current) {
    const oldIndex = current.index;
    // 子节点是更新
    // lastPlacedIndex 记录了上次dom节点的相对更新节点的最远位置
    // old 0 1 2 3 4
    // new 2 1 3 4
    // 2 1(6) 3 4
    if (oldIndex < lastPlacedIndex) {
      // move
      newFiber.flags |= Placement;
      return lastPlacedIndex;
    } else {
      return oldIndex;
    }
  } else {
    // 子节点是初次渲染
    newFiber.flags |= Placement;
    return lastPlacedIndex;
  }
}
//删除
function deleteChild(returnFiber, childToDelete) {
  const deletions = returnFiber.deletions;
  if (deletions) {
    returnFiber.deletions.push(childToDelete);
  } else {
    returnFiber.deletions = [childToDelete];
  }
}
function deleteRemainingChildren(returnFiber:Fiber, currentFirstChild:Fiber|null) {
  let childToDelete:Fiber|null = currentFirstChild;

  while (childToDelete) {
    deleteChild(returnFiber, childToDelete);
    childToDelete = childToDelete.sibling;
  }
}
function mapRemainingChildren(currentFirstChild:Fiber|null) {
  const existingChildren = new Map();

  let existingChild:Fiber|null = currentFirstChild;
  while (existingChild) {
    // key: value
    // key||index: fiber
    existingChildren.set(
      existingChild.key || existingChild.index,
      existingChild
    );
    existingChild = existingChild.sibling;
  }

  return existingChildren;
}
