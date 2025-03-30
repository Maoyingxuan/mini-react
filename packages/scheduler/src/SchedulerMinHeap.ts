export type Heap = Array<Node>
export type Node = {
    id: number;
    sortIndex: number
}
//堆顶元素
export function peek(heap: Heap): Node | null {
    return heap.length === 0 ? null : heap[0];
}