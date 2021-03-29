import { DataflowFile } from './parser';
import * as R from 'ramda';

const threatTypeNames = {
    spoofing: 'Spoofing',
    tampering: 'Tampering',
    repudiation: 'Repudiation',
    information: 'Information disclosure',
    denial: 'Denial of service',
    elevation: 'Privilege elevation',
};

export const generateTable = (dataflow: DataflowFile, baseHeadingLevel: number): string => {
    const h1 = (s: string) => `<h${baseHeadingLevel}>${s}</h${baseHeadingLevel}>`;
    const h2 = (s: string) => `<h${baseHeadingLevel + 1}>${s}</h${baseHeadingLevel + 1}>`;

    const log = [];
    log.push(h1('Classes'));
    for (const className in dataflow.classes) {
        const c = dataflow.classes[className];
        log.push(h2(c.label));
        if (c.threats) {
            log.push('<table>');
            log.push('<tr><th>Threat type</th><th>Threat</th><th>Notes</th><th>Risk</th><th>Ticket</th></tr>');
            for (const threat of c.threats) {
                log.push(
                    `<tr><td>${threatTypeNames[threat.type]}</td><td>${threat.threat}</td><td>${threat.notes}</td><td>${
                        threat.risk
                    }</td><td>${threat.ticket}</td></tr>`,
                );
            }
            log.push('</table>');
        } else {
            log.push('No threats.');
        }
    }
    log.push('<table>');
    log.push(
        '<tr><th>Diagram element</th><th>Element type</th><th>Threat type</th><th>Threat</th><th>Notes</th><th>Risk</th><th>Ticket</th></tr>',
    );
    for (const [name, node] of R.toPairs(dataflow.nodes)) {
        const label = `${node.index}. ${node.label}`;
        for (const threat of node.threats) {
            log.push(
                `<tr><td>${label}</td><td>${node.type}</td><td>${threatTypeNames[threat.type]}</td><td>${
                    threat.threat
                }</td><td>${threat.notes}</td><td>${threat.risk}</td><td>${threat.ticket}</td></tr>`,
            );
        }
    }
    for (const [name, node] of R.toPairs(dataflow.nodes)) {
        for (const t of node.flows) {
            const label = `Flow ${t.index}`;
            for (const threat of t.threats) {
                log.push(
                    `<tr><td>${label}</td><td>Flow</td><td>${threatTypeNames[threat.type]}</td><td>${
                        threat.threat
                    }</td><td>${threat.notes}</td><td>${threat.risk}</td><td>${threat.ticket}</td></tr>`,
                );
            }
        }
    }
    log.push('</table>');
    return log.join('\n');
};
