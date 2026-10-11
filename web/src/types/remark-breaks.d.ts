declare module 'remark-breaks' {
  import { Root } from 'mdast'
  
  export default function remarkBreaks(): (tree: Root) => undefined
}

