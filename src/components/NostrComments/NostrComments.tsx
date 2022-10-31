import React from "react";
import './NostrComments.css';

export interface NostrCommentsProps {
    label: string;
}

const NostrComments = (props: NostrCommentsProps) => {
    return <button className='comment-widget-container'>{props.label}</button>;
};

export default NostrComments;
