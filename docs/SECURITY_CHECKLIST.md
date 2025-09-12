# Oqia Protocol Security Checklist

This checklist is a supplement to the [Threat Model](THREAT_MODEL.md) and should be used during development and before deployment.

## General Best Practices

*   [ ] All contracts inherit from `OqiaBase` (for ownership, etc.).
*   [ ] All external calls are checked for success.
*   [ ] The checks-effects-interactions pattern is used to prevent re-entrancy.
*   [ ] Slither static analysis is run on every commit.
*   [ ] A comprehensive test suite is in place with 100% coverage.

## OqiaBotFactory.sol

*   [ ] A fee is implemented for agent creation to prevent spam.
*   [ ] The agent creation process is atomic.

## OqiaSessionKeyManager.sol

*   [ ] Session keys have a default short expiry time.
*   [ ] Session key permissions are granular and follow the principle of least privilege.
*   [ ] A mechanism for immediate session key revocation is implemented and tested.

## OqiaModuleRegistry.sol

*   [ ] A curation mechanism (e.g., allowlist, token-based) is in place.
*   [ ] The process for adding and removing modules from the registry is secure and well-defined.
