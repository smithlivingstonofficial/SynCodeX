declare module 'react-quill' {
  import { ReactQuill } from 'react-quill';
  import { ReactElement } from 'react';

  interface ReactQuillProps {
    value?: string;
    onChange?: (content: string) => void;
    theme?: string;
    modules?: any;
    className?: string;
  }

  export default function ReactQuill(props: ReactQuillProps): ReactElement;
}