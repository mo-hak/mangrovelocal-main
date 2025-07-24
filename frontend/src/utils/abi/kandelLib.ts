export const kandelLibABI =  [
    {
    "type": "constructor",
    "inputs": [{
        "name": "mgv",
        "type": "address",
        "internalType": "contract IMangrove"
    }, {
        "name": "olKeyBaseQuote",
        "type": "tuple",
        "internalType": "struct OLKey",
        "components": [{
            "name": "outbound_tkn",
            "type": "address",
            "internalType": "address"
        }, {
            "name": "inbound_tkn",
            "type": "address",
            "internalType": "address"
        }, {
            "name": "tickSpacing",
            "type": "uint256",
            "internalType": "uint256"
        }]
    }, {
        "name": "gasreq",
        "type": "uint256",
        "internalType": "uint256"
    }],
    "stateMutability": "nonpayable"
}, {
    "type": "receive",
    "stateMutability": "payable"
}, {
    "type": "function",
    "name": "BASE",
    "inputs": [],
    "outputs": [{
        "name": "",
        "type": "address",
        "internalType": "contract IERC20"
    }],
    "stateMutability": "view"
}, {
    "type": "function",
    "name": "FUND_OWNER",
    "inputs": [],
    "outputs": [{
        "name": "",
        "type": "address",
        "internalType": "address"
    }],
    "stateMutability": "view"
}, {
    "type": "function",
    "name": "MGV",
    "inputs": [],
    "outputs": [{
        "name": "",
        "type": "address",
        "internalType": "contract IMangrove"
    }],
    "stateMutability": "view"
}, {
    "type": "function",
    "name": "QUOTE",
    "inputs": [],
    "outputs": [{
        "name": "",
        "type": "address",
        "internalType": "contract IERC20"
    }],
    "stateMutability": "view"
}, {
    "type": "function",
    "name": "ROUTER_IMPLEMENTATION",
    "inputs": [],
    "outputs": [{
        "name": "",
        "type": "address",
        "internalType": "contract AbstractRouter"
    }],
    "stateMutability": "view"
}, {
    "type": "function",
    "name": "STRICT_PULLING",
    "inputs": [],
    "outputs": [{
        "name": "",
        "type": "bool",
        "internalType": "bool"
    }],
    "stateMutability": "view"
}, {
    "type": "function",
    "name": "TICK_SPACING",
    "inputs": [],
    "outputs": [{
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
    }],
    "stateMutability": "view"
}, {
    "type": "function",
    "name": "activate",
    "inputs": [{
        "name": "token",
        "type": "address",
        "internalType": "contract IERC20"
    }],
    "outputs": [],
    "stateMutability": "nonpayable"
}, {
    "type": "function",
    "name": "admin",
    "inputs": [],
    "outputs": [{
        "name": "current",
        "type": "address",
        "internalType": "address"
    }],
    "stateMutability": "view"
}, {
    "type": "function",
    "name": "approve",
    "inputs": [{
        "name": "token",
        "type": "address",
        "internalType": "contract IERC20"
    }, {
        "name": "spender",
        "type": "address",
        "internalType": "address"
    }, {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
    }],
    "outputs": [{
        "name": "",
        "type": "bool",
        "internalType": "bool"
    }],
    "stateMutability": "nonpayable"
}, {
    "type": "function",
    "name": "baseQuoteTickOffset",
    "inputs": [],
    "outputs": [{
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
    }],
    "stateMutability": "view"
}, {
    "type": "function",
    "name": "createDistribution",
    "inputs": [{
        "name": "from",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "to",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "baseQuoteTickIndex0",
        "type": "int256",
        "internalType": "Tick"
    }, {
        "name": "_baseQuoteTickOffset",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "firstAskIndex",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "bidGives",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "askGives",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "pricePoints",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "stepSize",
        "type": "uint256",
        "internalType": "uint256"
    }],
    "outputs": [{
        "name": "distribution",
        "type": "tuple",
        "internalType": "struct DirectWithBidsAndAsksDistribution.Distribution",
        "components": [{
            "name": "asks",
            "type": "tuple[]",
            "internalType": "struct DirectWithBidsAndAsksDistribution.DistributionOffer[]",
            "components": [{
                "name": "index",
                "type": "uint256",
                "internalType": "uint256"
            }, {
                "name": "tick",
                "type": "int256",
                "internalType": "Tick"
            }, {
                "name": "gives",
                "type": "uint256",
                "internalType": "uint256"
            }]
        }, {
            "name": "bids",
            "type": "tuple[]",
            "internalType": "struct DirectWithBidsAndAsksDistribution.DistributionOffer[]",
            "components": [{
                "name": "index",
                "type": "uint256",
                "internalType": "uint256"
            }, {
                "name": "tick",
                "type": "int256",
                "internalType": "Tick"
            }, {
                "name": "gives",
                "type": "uint256",
                "internalType": "uint256"
            }]
        }]
    }],
    "stateMutability": "pure"
}, {
    "type": "function",
    "name": "depositFunds",
    "inputs": [{
        "name": "baseAmount",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "quoteAmount",
        "type": "uint256",
        "internalType": "uint256"
    }],
    "outputs": [],
    "stateMutability": "nonpayable"
}, {
    "type": "function",
    "name": "getOffer",
    "inputs": [{
        "name": "ba",
        "type": "uint8",
        "internalType": "enum OfferType"
    }, {
        "name": "index",
        "type": "uint256",
        "internalType": "uint256"
    }],
    "outputs": [{
        "name": "offer",
        "type": "uint256",
        "internalType": "Offer"
    }],
    "stateMutability": "view"
}, {
    "type": "function",
    "name": "indexOfOfferId",
    "inputs": [{
        "name": "ba",
        "type": "uint8",
        "internalType": "enum OfferType"
    }, {
        "name": "offerId",
        "type": "uint256",
        "internalType": "uint256"
    }],
    "outputs": [{
        "name": "index",
        "type": "uint256",
        "internalType": "uint256"
    }],
    "stateMutability": "view"
}, {
    "type": "function",
    "name": "makerExecute",
    "inputs": [{
        "name": "order",
        "type": "tuple",
        "internalType": "struct MgvLib.SingleOrder",
        "components": [{
            "name": "olKey",
            "type": "tuple",
            "internalType": "struct OLKey",
            "components": [{
                "name": "outbound_tkn",
                "type": "address",
                "internalType": "address"
            }, {
                "name": "inbound_tkn",
                "type": "address",
                "internalType": "address"
            }, {
                "name": "tickSpacing",
                "type": "uint256",
                "internalType": "uint256"
            }]
        }, {
            "name": "offerId",
            "type": "uint256",
            "internalType": "uint256"
        }, {
            "name": "offer",
            "type": "uint256",
            "internalType": "Offer"
        }, {
            "name": "takerWants",
            "type": "uint256",
            "internalType": "uint256"
        }, {
            "name": "takerGives",
            "type": "uint256",
            "internalType": "uint256"
        }, {
            "name": "offerDetail",
            "type": "uint256",
            "internalType": "OfferDetail"
        }, {
            "name": "global",
            "type": "uint256",
            "internalType": "Global"
        }, {
            "name": "local",
            "type": "uint256",
            "internalType": "Local"
        }]
    }],
    "outputs": [{
        "name": "ret",
        "type": "bytes32",
        "internalType": "bytes32"
    }],
    "stateMutability": "nonpayable"
}, {
    "type": "function",
    "name": "makerPosthook",
    "inputs": [{
        "name": "order",
        "type": "tuple",
        "internalType": "struct MgvLib.SingleOrder",
        "components": [{
            "name": "olKey",
            "type": "tuple",
            "internalType": "struct OLKey",
            "components": [{
                "name": "outbound_tkn",
                "type": "address",
                "internalType": "address"
            }, {
                "name": "inbound_tkn",
                "type": "address",
                "internalType": "address"
            }, {
                "name": "tickSpacing",
                "type": "uint256",
                "internalType": "uint256"
            }]
        }, {
            "name": "offerId",
            "type": "uint256",
            "internalType": "uint256"
        }, {
            "name": "offer",
            "type": "uint256",
            "internalType": "Offer"
        }, {
            "name": "takerWants",
            "type": "uint256",
            "internalType": "uint256"
        }, {
            "name": "takerGives",
            "type": "uint256",
            "internalType": "uint256"
        }, {
            "name": "offerDetail",
            "type": "uint256",
            "internalType": "OfferDetail"
        }, {
            "name": "global",
            "type": "uint256",
            "internalType": "Global"
        }, {
            "name": "local",
            "type": "uint256",
            "internalType": "Local"
        }]
    }, {
        "name": "result",
        "type": "tuple",
        "internalType": "struct MgvLib.OrderResult",
        "components": [{
            "name": "makerData",
            "type": "bytes32",
            "internalType": "bytes32"
        }, {
            "name": "mgvData",
            "type": "bytes32",
            "internalType": "bytes32"
        }]
    }],
    "outputs": [],
    "stateMutability": "nonpayable"
}, {
    "type": "function",
    "name": "noRouter",
    "inputs": [],
    "outputs": [{
        "name": "",
        "type": "tuple",
        "internalType": "struct Direct.RouterParams",
        "components": [{
            "name": "routerImplementation",
            "type": "address",
            "internalType": "contract AbstractRouter"
        }, {
            "name": "fundOwner",
            "type": "address",
            "internalType": "address"
        }, {
            "name": "strict",
            "type": "bool",
            "internalType": "bool"
        }]
    }],
    "stateMutability": "pure"
}, {
    "type": "function",
    "name": "offerIdOfIndex",
    "inputs": [{
        "name": "ba",
        "type": "uint8",
        "internalType": "enum OfferType"
    }, {
        "name": "index",
        "type": "uint256",
        "internalType": "uint256"
    }],
    "outputs": [{
        "name": "offerId",
        "type": "uint256",
        "internalType": "uint256"
    }],
    "stateMutability": "view"
}, {
    "type": "function",
    "name": "offeredVolume",
    "inputs": [{
        "name": "ba",
        "type": "uint8",
        "internalType": "enum OfferType"
    }],
    "outputs": [{
        "name": "volume",
        "type": "uint256",
        "internalType": "uint256"
    }],
    "stateMutability": "view"
}, {
    "type": "function",
    "name": "params",
    "inputs": [],
    "outputs": [{
        "name": "gasprice",
        "type": "uint32",
        "internalType": "uint32"
    }, {
        "name": "gasreq",
        "type": "uint24",
        "internalType": "uint24"
    }, {
        "name": "stepSize",
        "type": "uint32",
        "internalType": "uint32"
    }, {
        "name": "pricePoints",
        "type": "uint32",
        "internalType": "uint32"
    }],
    "stateMutability": "view"
}, {
    "type": "function",
    "name": "pending",
    "inputs": [{
        "name": "ba",
        "type": "uint8",
        "internalType": "enum OfferType"
    }],
    "outputs": [{
        "name": "",
        "type": "int256",
        "internalType": "int256"
    }],
    "stateMutability": "view"
}, {
    "type": "function",
    "name": "populate",
    "inputs": [{
        "name": "distribution",
        "type": "tuple",
        "internalType": "struct DirectWithBidsAndAsksDistribution.Distribution",
        "components": [{
            "name": "asks",
            "type": "tuple[]",
            "internalType": "struct DirectWithBidsAndAsksDistribution.DistributionOffer[]",
            "components": [{
                "name": "index",
                "type": "uint256",
                "internalType": "uint256"
            }, {
                "name": "tick",
                "type": "int256",
                "internalType": "Tick"
            }, {
                "name": "gives",
                "type": "uint256",
                "internalType": "uint256"
            }]
        }, {
            "name": "bids",
            "type": "tuple[]",
            "internalType": "struct DirectWithBidsAndAsksDistribution.DistributionOffer[]",
            "components": [{
                "name": "index",
                "type": "uint256",
                "internalType": "uint256"
            }, {
                "name": "tick",
                "type": "int256",
                "internalType": "Tick"
            }, {
                "name": "gives",
                "type": "uint256",
                "internalType": "uint256"
            }]
        }]
    }, {
        "name": "parameters",
        "type": "tuple",
        "internalType": "struct CoreKandel.Params",
        "components": [{
            "name": "gasprice",
            "type": "uint32",
            "internalType": "uint32"
        }, {
            "name": "gasreq",
            "type": "uint24",
            "internalType": "uint24"
        }, {
            "name": "stepSize",
            "type": "uint32",
            "internalType": "uint32"
        }, {
            "name": "pricePoints",
            "type": "uint32",
            "internalType": "uint32"
        }]
    }, {
        "name": "baseAmount",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "quoteAmount",
        "type": "uint256",
        "internalType": "uint256"
    }],
    "outputs": [],
    "stateMutability": "payable"
}, {
    "type": "function",
    "name": "populateChunk",
    "inputs": [{
        "name": "distribution",
        "type": "tuple",
        "internalType": "struct DirectWithBidsAndAsksDistribution.Distribution",
        "components": [{
            "name": "asks",
            "type": "tuple[]",
            "internalType": "struct DirectWithBidsAndAsksDistribution.DistributionOffer[]",
            "components": [{
                "name": "index",
                "type": "uint256",
                "internalType": "uint256"
            }, {
                "name": "tick",
                "type": "int256",
                "internalType": "Tick"
            }, {
                "name": "gives",
                "type": "uint256",
                "internalType": "uint256"
            }]
        }, {
            "name": "bids",
            "type": "tuple[]",
            "internalType": "struct DirectWithBidsAndAsksDistribution.DistributionOffer[]",
            "components": [{
                "name": "index",
                "type": "uint256",
                "internalType": "uint256"
            }, {
                "name": "tick",
                "type": "int256",
                "internalType": "Tick"
            }, {
                "name": "gives",
                "type": "uint256",
                "internalType": "uint256"
            }]
        }]
    }],
    "outputs": [],
    "stateMutability": "nonpayable"
}, {
    "type": "function",
    "name": "populateChunkFromOffset",
    "inputs": [{
        "name": "from",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "to",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "baseQuoteTickIndex0",
        "type": "int256",
        "internalType": "Tick"
    }, {
        "name": "firstAskIndex",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "bidGives",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "askGives",
        "type": "uint256",
        "internalType": "uint256"
    }],
    "outputs": [],
    "stateMutability": "payable"
}, {
    "type": "function",
    "name": "populateFromOffset",
    "inputs": [{
        "name": "from",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "to",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "baseQuoteTickIndex0",
        "type": "int256",
        "internalType": "Tick"
    }, {
        "name": "_baseQuoteTickOffset",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "firstAskIndex",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "bidGives",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "askGives",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "parameters",
        "type": "tuple",
        "internalType": "struct CoreKandel.Params",
        "components": [{
            "name": "gasprice",
            "type": "uint32",
            "internalType": "uint32"
        }, {
            "name": "gasreq",
            "type": "uint24",
            "internalType": "uint24"
        }, {
            "name": "stepSize",
            "type": "uint32",
            "internalType": "uint32"
        }, {
            "name": "pricePoints",
            "type": "uint32",
            "internalType": "uint32"
        }]
    }, {
        "name": "baseAmount",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "quoteAmount",
        "type": "uint256",
        "internalType": "uint256"
    }],
    "outputs": [],
    "stateMutability": "payable"
}, {
    "type": "function",
    "name": "provisionOf",
    "inputs": [{
        "name": "olKey",
        "type": "tuple",
        "internalType": "struct OLKey",
        "components": [{
            "name": "outbound_tkn",
            "type": "address",
            "internalType": "address"
        }, {
            "name": "inbound_tkn",
            "type": "address",
            "internalType": "address"
        }, {
            "name": "tickSpacing",
            "type": "uint256",
            "internalType": "uint256"
        }]
    }, {
        "name": "offerId",
        "type": "uint256",
        "internalType": "uint256"
    }],
    "outputs": [{
        "name": "provision",
        "type": "uint256",
        "internalType": "uint256"
    }],
    "stateMutability": "view"
}, {
    "type": "function",
    "name": "reserveBalance",
    "inputs": [{
        "name": "ba",
        "type": "uint8",
        "internalType": "enum OfferType"
    }],
    "outputs": [{
        "name": "balance",
        "type": "uint256",
        "internalType": "uint256"
    }],
    "stateMutability": "view"
}, {
    "type": "function",
    "name": "retractAndWithdraw",
    "inputs": [{
        "name": "from",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "to",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "baseAmount",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "quoteAmount",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "freeWei",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "recipient",
        "type": "address",
        "internalType": "address payable"
    }],
    "outputs": [],
    "stateMutability": "nonpayable"
}, {
    "type": "function",
    "name": "retractOffers",
    "inputs": [{
        "name": "from",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "to",
        "type": "uint256",
        "internalType": "uint256"
    }],
    "outputs": [],
    "stateMutability": "nonpayable"
}, {
    "type": "function",
    "name": "router",
    "inputs": [{
        "name": "",
        "type": "address",
        "internalType": "address"
    }],
    "outputs": [{
        "name": "",
        "type": "address",
        "internalType": "contract AbstractRouter"
    }],
    "stateMutability": "view"
}, {
    "type": "function",
    "name": "router",
    "inputs": [],
    "outputs": [{
        "name": "",
        "type": "address",
        "internalType": "contract AbstractRouter"
    }],
    "stateMutability": "view"
}, {
    "type": "function",
    "name": "setAdmin",
    "inputs": [{
        "name": "admin_",
        "type": "address",
        "internalType": "address"
    }],
    "outputs": [],
    "stateMutability": "nonpayable"
}, {
    "type": "function",
    "name": "setBaseQuoteTickOffset",
    "inputs": [{
        "name": "_baseQuoteTickOffset",
        "type": "uint256",
        "internalType": "uint256"
    }],
    "outputs": [],
    "stateMutability": "nonpayable"
}, {
    "type": "function",
    "name": "setGasprice",
    "inputs": [{
        "name": "gasprice",
        "type": "uint256",
        "internalType": "uint256"
    }],
    "outputs": [],
    "stateMutability": "nonpayable"
}, {
    "type": "function",
    "name": "setGasreq",
    "inputs": [{
        "name": "gasreq",
        "type": "uint256",
        "internalType": "uint256"
    }],
    "outputs": [],
    "stateMutability": "nonpayable"
}, {
    "type": "function",
    "name": "setStepSize",
    "inputs": [{
        "name": "stepSize",
        "type": "uint256",
        "internalType": "uint256"
    }],
    "outputs": [],
    "stateMutability": "nonpayable"
}, {
    "type": "function",
    "name": "withdrawFromMangrove",
    "inputs": [{
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "receiver",
        "type": "address",
        "internalType": "address payable"
    }],
    "outputs": [],
    "stateMutability": "nonpayable"
}, {
    "type": "function",
    "name": "withdrawFunds",
    "inputs": [{
        "name": "baseAmount",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "quoteAmount",
        "type": "uint256",
        "internalType": "uint256"
    }, {
        "name": "recipient",
        "type": "address",
        "internalType": "address"
    }],
    "outputs": [],
    "stateMutability": "nonpayable"
}, {
    "type": "event",
    "name": "Credit",
    "inputs": [{
        "name": "token",
        "type": "address",
        "indexed": true,
        "internalType": "contract IERC20"
    }, {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
    }],
    "anonymous": false
}, {
    "type": "event",
    "name": "Debit",
    "inputs": [{
        "name": "token",
        "type": "address",
        "indexed": true,
        "internalType": "contract IERC20"
    }, {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
    }],
    "anonymous": false
}, {
    "type": "event",
    "name": "LogIncident",
    "inputs": [{
        "name": "olKeyHash",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
    }, {
        "name": "offerId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
    }, {
        "name": "makerData",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
    }, {
        "name": "mgvData",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
    }],
    "anonymous": false
}, {
    "type": "event",
    "name": "OfferListKey",
    "inputs": [{
        "name": "olKeyHash",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
    }],
    "anonymous": false
}, {
    "type": "event",
    "name": "PopulateEnd",
    "inputs": [],
    "anonymous": false
}, {
    "type": "event",
    "name": "PopulateStart",
    "inputs": [],
    "anonymous": false
}, {
    "type": "event",
    "name": "RetractEnd",
    "inputs": [],
    "anonymous": false
}, {
    "type": "event",
    "name": "RetractStart",
    "inputs": [],
    "anonymous": false
}, {
    "type": "event",
    "name": "SetAdmin",
    "inputs": [{
        "name": "admin",
        "type": "address",
        "indexed": false,
        "internalType": "address"
    }],
    "anonymous": false
}, {
    "type": "event",
    "name": "SetBaseQuoteTickOffset",
    "inputs": [{
        "name": "value",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
    }],
    "anonymous": false
}, {
    "type": "event",
    "name": "SetGasprice",
    "inputs": [{
        "name": "value",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
    }],
    "anonymous": false
}, {
    "type": "event",
    "name": "SetGasreq",
    "inputs": [{
        "name": "value",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
    }],
    "anonymous": false
}, {
    "type": "event",
    "name": "SetIndexMapping",
    "inputs": [{
        "name": "ba",
        "type": "uint8",
        "indexed": true,
        "internalType": "enum OfferType"
    }, {
        "name": "index",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
    }, {
        "name": "offerId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
    }],
    "anonymous": false
}, {
    "type": "event",
    "name": "SetLength",
    "inputs": [{
        "name": "value",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
    }],
    "anonymous": false
}, {
    "type": "event",
    "name": "SetStepSize",
    "inputs": [{
        "name": "value",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
    }],
    "anonymous": false
} ] as const;