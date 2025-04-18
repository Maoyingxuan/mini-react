// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'

import './index.css'
import { ReactDOM, Component, useReducer } from '../whichreact.ts'
function FunctionComponent(props: {name: string}) {
  const [count,setCount] = useReducer((x)=>x+1,0)
return (
  <div
    className="border">
    <p>{props.name}</p>
    <button onClick={()=>setCount()}>{count}</button>
  </div>
);
}
// class ClassComponent extends Component<{name:string}>{
//   render(){
//     return(
//       <div className='border'>
//         <h3>{this.props.name}</h3>
//       </div>
//     )
//   }
// }
const jsx = (
  <div className="border">
    {/* <h1>react</h1>
    <a>mini react</a> */}
    <FunctionComponent name="函数组件" />
    {/* <ClassComponent name="类组件" /> */}
    {/* 111
    <ul>
      <>
      <li>1</li>
      <li>2</li>
      </>
    </ul> */}
    {/* <FragmentComponent /> */}
  </div>
);
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(jsx);