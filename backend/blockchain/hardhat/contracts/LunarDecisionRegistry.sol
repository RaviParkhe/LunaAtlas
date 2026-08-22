// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract LunarDecisionRegistry {
    
    struct DecisionRecord {
        bytes32 datasetHash;
        bytes32 featureConfigHash;
        bytes32 preprocessingHash;
        bytes32 modelHash;
        bytes32 clusterHash;
        bytes32 ahpConfigHash;
        bytes32 ahpResultHash;
        bytes32 mlXaiHash;
        bytes32 ahpXaiHash;
        bytes32 geminiHash;
        bytes32 counterfactualHash;
        bytes32 reportHash;
        uint256 timestamp;
        string siteId;
        string pipelineVersion;
    }

    mapping(bytes32 => DecisionRecord) private registry;
    mapping(bytes32 => bool) private exists;

    event DecisionRegistered(
        bytes32 indexed decisionId,
        string siteId,
        uint256 timestamp
    );

    function registerDecision(
        bytes32 _decisionId,
        DecisionRecord memory _record
    ) public {
        require(!exists[_decisionId], "Decision already registered");
        registry[_decisionId] = _record;
        exists[_decisionId] = true;

        emit DecisionRegistered(_decisionId, _record.siteId, _record.timestamp);
    }

    function getDecision(bytes32 _decisionId) public view returns (DecisionRecord memory) {
        require(exists[_decisionId], "Decision not found");
        return registry[_decisionId];
    }

    function decisionExists(bytes32 _decisionId) public view returns (bool) {
        return exists[_decisionId];
    }
}
