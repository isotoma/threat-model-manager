#! /usr/bin/env node
import * as yargs from 'yargs';
import { parseDataflowFile, checkDataflowFile } from './parser';
import { generateGraph, legend } from './diagram';
import { generateTable } from './table';

import fs from 'fs';
import child_process from 'child_process';

const argv = yargs
    .command('generate <input>', 'Generate output', (yargs) =>
        yargs
            .positional('input', {
                describe: 'the input yaml file',
                type: 'string',
            })
            .demandOption(['input']),
    )
    .demandCommand(1)
    .help().argv;

export interface GenerateProps {
    readonly input: string;
}

const generate = (props: GenerateProps) => {
    const dataflow = parseDataflowFile(props.input);
    checkDataflowFile(dataflow);
    const graph = generateGraph(dataflow);
    const table = generateTable(dataflow);

    const prefix = props.input.endsWith('.yaml') ? props.input.substr(0, props.input.length - 5) : props.input;
    fs.writeFileSync(`${prefix}.dot`, graph);
    fs.writeFileSync(`${prefix}.html`, table);
    fs.writeFileSync(`${prefix}.legend.dot`, legend());
    if (fs.existsSync(`${prefix}.png`)) {
        fs.unlinkSync(`${prefix}.png`);
    }
    const dot = child_process.spawnSync('dot', ['-Tpng', `${prefix}.dot`, '-o', `${prefix}.png`]);
    if (dot.error) {
        console.error(dot.error);
        process.exit(1);
    }
    const leg = child_process.spawnSync('dot', ['-Tpng', `${prefix}.legend.dot`, '-o', `${prefix}.legend.png`]);
    if (leg.error) {
        console.error(dot.error);
        process.exit(1);
    }
};

switch (argv['_'][0]) {
    case 'generate':
        generate(argv);
        break;
}
