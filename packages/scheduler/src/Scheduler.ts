import { getCurrentTime, isObject } from '../../shared/utils';
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
    }else{
        newTask.sortIndex = expirationTime
        taskQueue.push(newTask)
    }
}
