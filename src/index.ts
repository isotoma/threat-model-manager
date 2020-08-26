import * as R from 'ramda';
import * as fs from 'fs';
import * as t from 'io-ts';
import {withFallback} from 'io-ts-types';
import { isRight } from 'fp-ts/lib/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { safeLoad } from 'js-yaml';
import child_process from 'child_process';

const NodeType = t.union([
    t.literal('process'),
    t.literal('datastore'),
    t.literal('external')
])

const STRIDE = t.union([
    t.literal('spoofing'),
    t.literal('tampering'),
    t.literal('repudiation'),
    t.literal('information'),
    t.literal('denial'),
    t.literal('elevation'),
]);

const Threat = t.type({
    type: STRIDE,
    threat: t.string,
    risk: withFallback(t.number, 1),
    notes: withFallback(t.string, ''),
    ticket: withFallback(t.string, ''),
})

type Threat = t.TypeOf<typeof Threat>;

const Flow = t.type({
    to: t.string,
    threats: withFallback(t.array(Threat), []),
})

type Flow = t.TypeOf<typeof Flow>;

const FlowNode = t.type({
    label: t.string,
    type: withFallback(NodeType, 'process'),
    threats: withFallback(t.array(Threat), []),
    flows: withFallback(t.array(Flow), [])
})

type FlowNode = t.TypeOf<typeof FlowNode>;

const DataflowFile = t.type({
    nodes: t.dictionary(t.string, FlowNode),
});

type DataflowFile = t.TypeOf<typeof DataflowFile>;

const parseDataflowFile = (filename: string): DataflowFile => {
    const raw = fs.readFileSync(filename).toString();
    const yaml = safeLoad(raw);
    const decoded = DataflowFile.decode(yaml);
    if(isRight(decoded)) {
        return decoded.right;
    } else {
        console.log(PathReporter.report(decoded).join('\n'));
        process.exit(-1);        
    }
}

const check = (dataflow:DataflowFile) => {
    for(const [name, node] of R.toPairs(dataflow.nodes)) {
        if(node.flows) {
            for (const n of node.flows) {
                if (!dataflow.nodes[n.to]) {
                    console.error(`node ${n.to} referenced by ${name} does not exist`)
                }
            }
        }
    }
}

const nodeStyle = (node: FlowNode): string => {
    switch (node.type) {
        case 'datastore':
            return "shape=box3d"
        case 'external':
            return "shape=box,style=dashed"
        default:
            return "shape=box,style=rounded"
    }
}

const legend = () => {
    const gv = [];
    gv.push('digraph G {');
    gv.push('rankdir=LR')
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
    gv.push('}')
    return gv.join("\n");
}

interface Model {
    log: string;
    dot: string;
}

const graphviz = (dataflow: DataflowFile) => {
    const gv = [];
    const log = [];
    let index = 1;
    log.push('<table>');
    log.push('<tr><th>Diagram element</th><th>Element type</th><th>Threat type</th><th>Threat</th><th>Notes</th><th>Risk</th><th>Ticket</th></tr>')
    gv.push('digraph G {');
    gv.push('    graph [fontname="helvetica",fontsize=10];');
    gv.push('    node [fontname="helvetica",fontsize=10];');
    gv.push('    edge [fontname="helvetica",fontsize=10];');
    for(const [name, node] of R.toPairs(dataflow.nodes)) {
        const nodeIndex = index++;
        const label = `${nodeIndex}. ${node.label}`;
        gv.push(`    "${name}" [label="${label}",${nodeStyle(node)}];`)
        for (const threat of node.threats) {
            log.push(`<tr><td>${label}</td><td>${node.type}</td><td>${threat.type}</td><td>${threat.threat}</td><td>${threat.notes}</td><td>${threat.risk}</td><td>${threat.ticket}</td></tr>`)
        }
    }
    for(const [name, node] of R.toPairs(dataflow.nodes)) {
            for (const t of node.flows) {
                const edgeIndex = index++;
                gv.push(`    ${name} -> ${t.to} [label="${edgeIndex}"];`)
            }
    }
    gv.push('}');
    log.push('</table>');
    return {
        log: log.join("\n"),
        dot: gv.join("\n"),
    }
}
