import * as R from 'ramda';
import * as fs from 'fs';
import * as t from 'io-ts';
import { withFallback } from 'io-ts-types';
import { isRight } from 'fp-ts/lib/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { safeLoad } from 'js-yaml';

const NodeType = t.union([t.literal('process'), t.literal('datastore'), t.literal('external')]);

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
});

type Threat = t.TypeOf<typeof Threat>;

const Flow = t.type({
    to: t.string,
    index: withFallback(t.number, -1),
    threats: withFallback(t.array(Threat), []),
});

type Flow = t.TypeOf<typeof Flow>;

const FlowNode = t.type({
    index: withFallback(t.number, -1),
    label: t.string,
    component: withFallback(t.string, ''),
    classes: withFallback(t.array(t.string), []),
    type: withFallback(NodeType, 'process'),
    threats: withFallback(t.array(Threat), []),
    flows: withFallback(t.array(Flow), []),
});

export type FlowNode = t.TypeOf<typeof FlowNode>;

const Component = t.type({
    label: t.string,
});

const Class = t.type({
    label: t.string,
    threats: withFallback(t.array(Threat), []),
});

const DataflowFile = t.type({
    components: t.dictionary(t.string, Component),
    classes: t.dictionary(t.string, Class),
    nodes: t.dictionary(t.string, FlowNode),
});

export type DataflowFile = t.TypeOf<typeof DataflowFile>;

export const parseDataflowFile = (filename: string): DataflowFile => {
    const raw = fs.readFileSync(filename).toString();
    const yaml = safeLoad(raw);
    const decoded = DataflowFile.decode(yaml);
    if (isRight(decoded)) {
        return decoded.right;
    } else {
        console.log(PathReporter.report(decoded).join('\n'));
        process.exit(-1);
    }
};

export const updateIndex = (dataflow: DataflowFile) => {
    const nodeIndexes = R.map(R.prop('index'), R.values(dataflow.nodes));
    const edgeIndexes = R.map(R.prop('index'), R.flatten(R.map(R.prop('flows'), R.values(dataflow.nodes))));
    const maxIndex = R.reduce(R.max, 0, R.reject(R.equals(-1), nodeIndexes.concat(edgeIndexes)));
    let i = (maxIndex as number) + 1;
    for (const node of R.values(dataflow.nodes)) {
        if (node.index == -1) {
            node.index = i++;
        }
        for (const flow of node.flows) {
            if (flow.index == -1) {
                flow.index = i++;
            }
        }
    }
};

export const checkDataflowFile = (dataflow: DataflowFile) => {
    let valid = true;
    for (const [name, node] of R.toPairs(dataflow.nodes)) {
        if (node.component) {
            if (!dataflow.components[node.component]) {
                console.error(`component ${node.component} referenced by node ${name} does not exist`);
                valid = false;
            }
        }
        if (node.classes) {
            for (const c of node.classes) {
                if (!dataflow.classes[c]) {
                    console.error(`class ${c} referenced by ${name} does not exist`);
                    valid = false;
                }
            }
        }
        if (node.flows) {
            for (const n of node.flows) {
                if (!dataflow.nodes[n.to]) {
                    console.error(`node ${n.to} referenced by ${name} does not exist`);
                    valid = false;
                }
            }
        }
    }
    if (!valid) {
        console.error('Errors in input file. exiting.');
        process.exit(1);
    }
};
