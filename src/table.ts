import { DataflowFile } from './parser';
import * as R from 'ramda';

export const generateTable = (dataflow: DataflowFile): string => {
    const log = [];
    let index = 1;
    log.push('<table>');
    log.push(
        '<tr><th>Diagram element</th><th>Element type</th><th>Threat type</th><th>Threat</th><th>Notes</th><th>Risk</th><th>Ticket</th></tr>',
    );
    for (const [name, node] of R.toPairs(dataflow.nodes)) {
        const nodeIndex = index++;
        const label = `${nodeIndex}. ${node.label}`;
        for (const threat of node.threats) {
            log.push(
                `<tr><td>${label}</td><td>${node.type}</td><td>${threat.type}</td><td>${threat.threat}</td><td>${threat.notes}</td><td>${threat.risk}</td><td>${threat.ticket}</td></tr>`,
            );
        }
    }
    for (const [name, node] of R.toPairs(dataflow.nodes)) {
        for (const t of node.flows) {
            const edgeIndex = index++;
            const label = `Flow ${edgeIndex}`;
            for (const threat of t.threats) {
                log.push(
                    `<tr><td>${label}</td><td>Flow</td><td>${threat.type}</td><td>${threat.threat}</td><td>${threat.notes}</td><td>${threat.risk}</td><td>${threat.ticket}</td></tr>`,
                );
            }
        }
    }
    log.push('</table>');
    return log.join('\n');
};
