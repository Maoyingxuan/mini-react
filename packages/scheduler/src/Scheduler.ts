import { getCurrentTime, isObject } from '../../shared/utils';
import { peek } from './SchedulerMinHeap';
import { PriorityLevel,getTimeoutByPriorityLevel } from './SchedulerPriorities';
type Callback = any
//任务
export interface Task {
    id: number;   //序列号，累加
    callback: Callback; //回调
    priorityLevel: PriorityLevel; //优先级
    startTime: number;
    expirationTime: number;
    sortIndex: number;
}
// 任务存储，最小堆
const taskQueue: Array<Task> = []; //立即执行任务，无delay
const timerQueue: Array<Task> = [];  // 延迟任务，有delay
let taskIdCounter: number = 1;
// 在计时
let isHostTimeoutScheduled: boolean = false;
// 在调度任务
let isHostCallbackScheduled = false;
let taskTimeoutID: number = -1;
//取消倒计时
function cancelHostTimeout(){
    clearTimeout(taskIdCounter)
    taskIdCounter = -1
}
//开始倒计时
function requestHostTimeout(callback:Callback,ms:number){
    taskIdCounter = setTimeout(()=>{
        callback(getCurrentTime())
    },ms)
}
// 检查timerQueue中的任务，是否有任务到期了呢，到期了就把当前'有效'任务移动到taskQueue
function advanceTimers(currentTime:number){
    let timer:Task = peek(timerQueue) as Task
    while(timer){
        if(timer.callback == null){ //无效任务
            timerQueue.pop()
        }else if(timer.startTime < currentTime){
            timerQueue.pop()
            timer.sortIndex = timer.expirationTime
            taskQueue.push(timer)
        }else{
            return
        }
        timer = peek(timerQueue) as Task
    }
}
//倒计时结束
function handleTimeout(currentTime:number){
    isHostTimeoutScheduled = false
    advanceTimers(currentTime)
    if(!isHostCallbackScheduled){
        if (peek(taskQueue) !== null) {
            isHostCallbackScheduled = true;
            requestHostCallback(flushWork);
          } else {
            const firstTimer: Task = peek(timerQueue) as Task;
            if (firstTimer !== null) {
              requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
            }
        }
    }
}
//todo
function requestHostCallback(callback:Callback){

}
//todo
function flushWork(){
    
}
export function scheduleCallback(
    priorityLevel:PriorityLevel,
    callback:Callback,
    options?:{delay:number}
){
    //任务进入调度
    const currentTime = getCurrentTime()
    let startTime: number;
    if (isObject(options) && options !== null) {
      let delay = options?.delay;
      if (typeof delay === "number" && delay > 0) {
        startTime = currentTime + delay;
      } else {
        startTime = currentTime;
      }
    } else {
      startTime = currentTime;
    }
    const timeout = getTimeoutByPriorityLevel(priorityLevel);
    const expirationTime = startTime + timeout;
    const newTask = {
        id: taskIdCounter++,
        callback,
        priorityLevel,
        startTime, //任务开始调度理论时间
        expirationTime,  //过期时间
        sortIndex: -1 //越小越优先调度
    }
    if(startTime > currentTime){  //任务延迟
        newTask.sortIndex = startTime
        timerQueue.push(newTask)
        if(peek(taskQueue) === null && newTask === peek(timerQueue)){
            if (isHostTimeoutScheduled) {
                cancelHostTimeout();
              } else {
                isHostTimeoutScheduled = true;
              }
            requestHostTimeout(handleTimeout,startTime - currentTime)
        }
    }else{ //任务不延迟
        newTask.sortIndex = expirationTime
        taskQueue.push(newTask)
    }
}
