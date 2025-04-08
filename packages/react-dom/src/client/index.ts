import { FiberRoot } from './../../../react-reconciler/src/ReactInternalTypes';
import {createFiberRoot} from './../../../react-reconciler/src/ReactFiberRoot';
import {updateContainer} from './../../../react-reconciler/src/ReactFiberLoop';
function ReactDomRoot(_internalRoot:FiberRoot){
    this._internalRoot = _internalRoot
}
ReactDomRoot.prototype.render = function (children){
    console.log(children)
    updateContainer(children, this._internalRoot)
}
export const createRoot = (container: Element | Document | DocumentFragment) => {
    const root: FiberRoot = createFiberRoot(container)
    return new ReactDomRoot(root)
}
export default {createRoot}
