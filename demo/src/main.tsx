// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'

import './index.css'
import { ReactDOM, Component, useReducer,  useLayoutEffect, useEffect } from '../whichreact.ts'
// import { useEffect } from 'react'
// import { useLayoutEffect } from 'react';
function FunctionComponent(props: {name: string}) {
  const [count,setCount] = useReducer((x)=>x+1,0)
  useLayoutEffect(()=>{
    console.log('useLayoutEffect')
  },[])
  useEffect(()=>{
    console.log('useEffect')
  },[count])
return (
  <div
    className="border">
    <p>{props.name}</p>
    <button onClick={()=>setCount()}>{count}</button>
    {count % 2 ? <div>omg</div> : <span>123</span>}
    <ul>
        {/* <li>随着count2的奇偶性变化</li> */}
        {count % 2 === 0
          ? [2, 1, 3, 4].map((item) => {
              return <li key={item}>{item}</li>;
            })
          : [0, 1, 2, 3, 4].map((item) => {
              return <li key={item}>{item}</li>;
            })}
      </ul>
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