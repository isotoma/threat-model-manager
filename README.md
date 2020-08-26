# threat-model-manager

Documentation management for threat models

## Input file format

The input file is a YAML file of the following format:

    nodes:
      node_name_a:
        label: The name for node a
        threats:
        - type: <threat type>
          threat: text for threat
          notes: some text
          risk: a number
          ticket: a reference to a ticket for resolution/mitigation
        flows:
        - to: node_name_b
          threats:
          - type: <threat type>
            threat: text for threat
            notes: some text
            risk: a number
            ticket: a reference to a ticket for resolution/mitigation

The threat types are one of:

- spoofing
- tampering
- repudiation
- information
- denial
- elevation

node names are only used for references between flows and nodes, but the model is checked to ensure there are no dangling references, but orphans are ok.

## Output

The output is a graphviz dot file, and a png, a legend png and an html file of threats which can be pasted into a document.

Numeric references are generated on the fly, but are not stable if you add or remove nodes or flows.
