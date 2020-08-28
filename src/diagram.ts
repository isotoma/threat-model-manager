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

export const nodeLabeller = (dataflow: DataflowFile) => (node: FlowNode, includeComponent?: boolean) => {
    const prelabel = node.component && includeComponent ? `<i>${node.component}</i><br /><br />` : '';
    const sublabel = node.classes ? '<br />' + R.map((n) => `[${dataflow.classes[n].label}]<br />`, node.classes) : '';
    return `${prelabel}${node.index}. ${node.label}${sublabel}`;
};

export const generateGraph = (dataflow: DataflowFile): { [name: string]: string } => {
    const gv: { [name: string]: string[] } = {};
    const label = nodeLabeller(dataflow);
    for (const componentId of [''].concat(R.keys(dataflow.components))) {
        gv[componentId] = [];
        gv[componentId].push('digraph G {');
        gv[componentId].push('    graph [fontname="helvetica",fontsize=10];');
        gv[componentId].push('    node [fontname="helvetica",fontsize=10];');
        gv[componentId].push('    edge [fontname="helvetica",fontsize=10];');
    }
    const clusters = R.groupBy((x) => x[1].component, R.toPairs(dataflow.nodes));
    const clusterNames = R.keys(clusters);
    for (const clusterId in clusterNames) {
        const cluster = clusterNames[clusterId];
        if (cluster) {
            gv[''].push(`    subgraph cluster_${clusterId} {`);
            gv[cluster].push(`    subgraph cluster_${clusterId} {`);
            gv[''].push(`        label = "${dataflow.components[cluster].label}"`);
            gv[cluster].push(`        label = "${dataflow.components[cluster].label}"`);
        }
        for (const [name, node] of clusters[cluster]) {
            const nodeDefinition = `        "${name}" [label=<${label(node)}>,${nodeStyle(node)}];`;
            gv[''].push(nodeDefinition);
            gv[cluster].push(nodeDefinition);
        }
        if (cluster) {
            gv[''].push(`    }`);
            gv[cluster].push(`    }`);
        }
        for (const [name, node] of R.toPairs(dataflow.nodes)) {
            const added: string[] = [];
            for (const flow of node.flows) {
                const destNode = dataflow.nodes[flow.to];
                if (destNode.component == cluster && node.component != cluster && !R.contains(name, added)) {
                    added.push(name);
                    const nodeDefinition = `    "${name}" [label=<${label(node, true)}>,${nodeStyle(node)}];`;
                    gv[cluster].push(nodeDefinition);
                }
                if (destNode.component != cluster && node.component == cluster && !R.contains(flow.to, added)) {
                    added.push(flow.to);
                    const nodeDefinition = `    "${flow.to}" [label=<${label(destNode, true)}>,${nodeStyle(
                        destNode,
                    )}];`;
                    gv[cluster].push(nodeDefinition);
                }
            }
        }
        for (const [name, node] of R.toPairs(dataflow.nodes)) {
            for (const flow of node.flows) {
                const destNode = dataflow.nodes[flow.to];
                if (node.component == cluster || destNode.component == cluster) {
                    const flowText = `    "${name}" -> "${flow.to}" [label="${flow.index}"];`;
                    gv[cluster].push(flowText);
                }
            }
        }
    }
    for (const componentId of [''].concat(R.keys(dataflow.components))) {
        gv[componentId].push('}');
    }
    return R.map((x) => x.join('\n'), gv);
};
