import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'

import './index.css'
import { ReactDOM } from '../whichreact.ts'
// function FunctionComponent(props: {name: string}) {
// return (
//   <div
//     className="border red pink black id cls id as as xc vc sd as "
//     id="123"
//     data-id="123">
//     <p>{props.name}</p>
//   </div>
// );
// }
const jsx = (
  <div className="border">
    <h1>react</h1>
    <a href="https://github.com/bubucuo/mini-react">mini react</a>
    {/* <FunctionComponent name="函数组件" /> */}
    {/* <ClassComponent name="类组件" /> */}
    {/* <FragmentComponent /> */}
  </div>
);
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(jsx);