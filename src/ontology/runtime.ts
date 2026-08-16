import generatedOntology from "@/src/ontology/generated/ontology.json";
import { RuntimeOntologyArtifactSchema } from "@/src/ontology/contracts";
import { createOntologyLookup } from "@/src/ontology/lookup";

export const ontologyArtifact = RuntimeOntologyArtifactSchema.parse(
  generatedOntology,
);

const lookup = createOntologyLookup(ontologyArtifact.nodes);

export const getOntologyConcept = lookup.getOntologyConcept;
export const ontologyHasId = lookup.ontologyHasId;
export const getConceptsByFamily = lookup.getConceptsByFamily;
export const getConceptsByCategory = lookup.getConceptsByCategory;
export const findExactOntologyConcepts = lookup.findExactOntologyConcepts;
export const findOntologyConcepts = lookup.findOntologyConcepts;
export const searchOntologyByLabel = lookup.searchOntologyByLabel;
