import * as R from 'ramda';

import { FlowNode, DataflowFile } from './parser';

const nodeStyle = (node: FlowNode): string => {
    switch (node.type) {
        case 'datastore':
            return 'shape=box3d';
        case 'external':
            return 'shape=box,style=dashed';
        default:
            return 'shape=box,style=rounded';
    }
};

export const legend = () => {
    const gv = [];
    gv.push('digraph G {');
    gv.push('rankdir=LR');
    gv.push('    graph [fontname="helvetica",fontsize=10];');
    gv.push('    node [fontname="helvetica",fontsize=10];');
    gv.push('    edge [fontname="helvetica",fontsize=10];');
    gv.push(`
        process [shape=box,style=rounded];
        "external entity" [shape=component];
        A -> B [label="data flow"];
        "data store" [shape=box3d];
        "trust boundary" [shape=box, style=dotted];
    `);
    gv.push('}');
    return gv.join('\n');
};

export const generateGraph = (dataflow: DataflowFile): string => {
    const gv = [];
    let index = 1;
    gv.push('digraph G {');
    gv.push('    graph [fontname="helvetica",fontsize=10];');
    gv.push('    node [fontname="helvetica",fontsize=10];');
    gv.push('    edge [fontname="helvetica",fontsize=10];');
    for (const [name, node] of R.toPairs(dataflow.nodes)) {
        const nodeIndex = index++;
        const label = `${nodeIndex}. ${node.label}`;
        gv.push(`    "${name}" [label="${label}",${nodeStyle(node)}];`);
    }
    for (const [name, node] of R.toPairs(dataflow.nodes)) {
        for (const t of node.flows) {
            const edgeIndex = index++;
            gv.push(`    ${name} -> ${t.to} [label="${edgeIndex}"];`);
        }
    }
    gv.push('}');
    return gv.join('\n');
};