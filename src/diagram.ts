import * as R from 'ramda';

import { FlowNode, DataflowFile } from './parser';
import { getCurves } from 'crypto';

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

export const generateGraph = (dataflow: DataflowFile): { [name: string]: string } => {
    const gv: { [name: string]: string[] } = {};
    gv[''] = [];
    gv[''].push('digraph G {');
    gv[''].push('    graph [fontname="helvetica",fontsize=10];');
    gv[''].push('    node [fontname="helvetica",fontsize=10];');
    gv[''].push('    edge [fontname="helvetica",fontsize=10];');
    const clusters = R.groupBy((x) => x[1].component, R.toPairs(dataflow.nodes));
    const clusterNames = R.keys(clusters);
    for (const clusterId in clusterNames) {
        const cluster = clusterNames[clusterId];
        if (cluster) {
            gv[cluster] = [];
            gv[''].push(`    subgraph cluster_${clusterId} {`);
            gv[''].push(`        label = "${dataflow.components[cluster].label}"`);
        }
        for (const [name, node] of clusters[cluster]) {
            const label = `${node.index}. ${node.label}`;
            const nodeDefinition = `        "${name}" [label="${label}",${nodeStyle(node)}];`;
            gv[''].push(nodeDefinition);
            gv[cluster].push(nodeDefinition);
            for (const f of node.flows) {
                const toNode = dataflow.nodes[f.to];
                if (toNode.component) {
                    if (gv[toNode.component] === undefined) {
                        gv[toNode.component] = [];
                    }
                    gv[toNode.component].push(nodeDefinition);
                }
            }
        }
        if (cluster) {
            gv[''].push(`    }`);
        }
    }
    for (const [name, node] of R.toPairs(dataflow.nodes)) {
        for (const t of node.flows) {
            gv[''].push(`    "${name}" -> "${t.to}" [label="${t.index}"];`);
        }
    }
    gv[''].push('}');
    return R.map((x) => x.join('\n'), gv);
};
