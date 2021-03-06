#! /usr/bin/env node
import * as yargs from 'yargs';
import { parseDataflowFile, checkDataflowFile, updateIndex } from './parser';
import { generateGraph, legend } from './diagram';
import { generateTable } from './table';

import fs from 'fs';
import child_process from 'child_process';
import { update } from 'ramda';

const argv = yargs
    .command('generate <input>', 'Generate output', (yargs) =>
        yargs
            .positional('input', {
                describe: 'the input yaml file',
                type: 'string',
            })
            .option('base-heading-level', {
                describe: 'The base heading level i.e. 2 for h2',
                type: 'number',
                default: 1,
            })
            .demandOption(['input']),
    )
    .demandCommand(1)
    .help().argv;

export interface GenerateProps {
    readonly input: string;
    readonly 'base-heading-level': number;
}

const generate = (props: GenerateProps) => {
    const dataflow = parseDataflowFile(props.input);
    updateIndex(dataflow);
    checkDataflowFile(dataflow);
    const graphs = generateGraph(dataflow);
    const table = generateTable(dataflow, props['base-heading-level']);

    const prefix = props.input.endsWith('.yaml') ? props.input.substr(0, props.input.length - 5) : props.input;
    for (const graph in graphs) {
        const filePrefix = graph ? `${prefix}.${graph}` : prefix;
        fs.writeFileSync(`${filePrefix}.dot`, graphs[graph]);
        const dot = child_process.spawnSync('dot', ['-Tpng', `${filePrefix}.dot`, '-o', `${filePrefix}.png`]);
        if (dot.error) {
            console.error(dot.error);
            process.exit(1);
        }
    }
    fs.writeFileSync(`${prefix}.html`, table);
    fs.writeFileSync(`${prefix}.legend.dot`, legend());
    // if (fs.existsSync(`${prefix}.png`)) {
    //     fs.unlinkSync(`${prefix}.png`);
    // }
    const leg = child_process.spawnSync('dot', ['-Tpng', `${prefix}.legend.dot`, '-o', `${prefix}.legend.png`]);
    if (leg.error) {
        console.error(leg.error);
        process.exit(1);
    }
};

switch (argv['_'][0]) {
    case 'generate':
        generate(argv);
        break;
}
