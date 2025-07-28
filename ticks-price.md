# Ticks, ratios, and prices

On Mangrove, the price space of a market is discretized into _ticks_: It contains the price 1 `quote/base` and the smallest price increment (and decrement) is 1 basis point = 0.01%.

Formally, a $$tick∈Ztick∈Z$$ corresponds to the [ratio](https://old.docs.mangrove.exchange/developers/terms/ratio) $$1.0001tick=wants/gives1.0001tick=wants/gives$$ between the amount $$givesgives$$ promised by an offer and the amount $$wantswants$$ it requests. This corresponds to a [price](https://old.docs.mangrove.exchange/developers/terms/price) in the following way:

$$
price_{side \in \{asks, bids\}}(tick) = \begin{cases}
   ratio = wants/gives = 1.0001^{tick} &\text{if } side \equiv asks \\
   1/ratio = gives/wants = 1.0001^{-tick} &\text{if } side \equiv bids.
\end{cases}
$$

**Beware decimals!**\
As always when ERC-20 tokens are involved, careful handling of decimals is essential! Both in code and in documentation.

In the formulae on this page, we only consider raw values, i.e. token decimals are disregarded. On-chain, Mangrove does the same.

As an important example of the implications, note that while the price space contains the _raw_ price 1, it may not contain the user readable price 1. This is likely if base and quote have different numbers of decimals.

The next section discusses this in detail and explains how to handle decimals, including how to convert raw ratios and raw prices to their user representations.



Note that the relationship between ratio and price **depends on which side** of the book you are looking at:

* On the _asks_ side, it's fairly natural: The price is the ratio $wants/gives$ between the amount $gives$ of base tokens promised by an offer and the amount $wants$ of quote tokens it requests.
* On the _bids_ side, however, the price is the reciprocal of the $wants/gives$ ratio, i.e. price = $gives/wants$. This is because a bid wants base tokens and offers quote tokens and thus the ratio $wants/gives$ is in `base/quote`.

**Example** : On a WETH/DAI market:

* The price would be expressed in DAI per WETH (DAI/WETH)
  * Eg. 2,224 DAI/WETH
* On the asks side WETH-DAI (selling WETH or buying DAI), the ratio equals the price and has unit DAI/WETH
  * Eg. 2,224 DAI/WETH
* On the bids side DAI-WETH (buying WETH or selling DAI), the ratio equals 1/price and has unit WETH/DAI.
  * Eg. 0.0004496 WETH/DAI\


**Remember** : We often casually use the word ’price’ to refer to the ratio between the amount promised by an offer and the amount it requests. In the code however, we use the generic word ’ratio’ to avoid confusion with the normal notion of market price expressed in ’quote’ tokens per ‘base’ token.

## Decimals, raw values, and user representations

On-chain, ERC-20 amounts are integers. But when presented to users, ERC-20 tokens typically have a number of decimals, such that fractional amounts can be expressed.

The number of decimals is specified by the ERC-20 contract and differs between different ERC-20 tokens.

**Examples of ERC-20 amounts in raw and user representation :** \
Here are some ERC-20 tokens and example amounts in both the on-chain (so-called 'raw') format and their user representation.

| ERC-20 | Decimals | Raw amount example      | User representation    |
| ------ | -------- | ----------------------- | ---------------------- |
| USDC   | 6        | `87654321`              | 87.654321              |
| DAI    | 18       | `876543210987654321`    | 0.876543210987654321   |
| WETH   | 18       | `109876543210987654321` | 109.876543210987654321 |
| :::    |          |                         |                        |

When tokens have different numbers of decimals, their raw amounts are not easily relatable. The USD stable coins USDC and DAI are a good example illustrated in the example above: The amounts are in principle directly relatable as they denote a USD amount. But it's not obvious from the raw amounts, which of them represents the larger USD amount.

It becomes even more tricky on markets, where we need to express ratios and prices. When the base and quote tokens have different numbers of decimals, raw ratios and raw prices become non-intuitive.

Here are some examples of what this can look like:

| Market   | Decimals                   | Ask user ratio example (quote/base) | Ask ratio (raw)                                                       | Bid user ratio example (base/quote) | Bid ratio (raw)                                                                 |
| -------- | -------------------------- | ----------------------------------- | --------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------- |
| DAI/USDC | <p>DAI: 18<br>USDC: 6</p>  | $1$                                 | <p>$0.000000000001$<br>$= 1 * 10^{-12}$<br>$= 1 * 10^{6}/10^{18}$</p> | $1$                                 | <p>$1,000,000,000,000$<br>$= 1 * 10^{12}$<br>$= 1 * 10^{18}/10^{6}$</p>         |
| WETH/DAI | <p>WETH: 18<br>DAI: 18</p> | $2,224$                             | <p>$2,224$<br>$= 2,224 * 10^{0}$<br>$= 2,224 * 10^{18}/10^{18}$</p>   | $0.0004410$                         | <p>$0.0004410$<br>$= 0.0004410 * 10^{0}$<br>$= 0.0004410 * 10^{18}/10^{18}$</p> |

On-chain, Mangrove only works with raw token amounts and ratios between them. And the relationsships between ticks, ratios, and prices described on this page hold for raw token amounts.

The formulae for converting between raw ratios\&prices and their user representations are the following:

$$
\def\arraystretch{1.5}
\begin{array}{rcl}
userRepresentation(raw\_ratio) & = & raw\_ratio * 10^{outbound\_decimals - inbound\_decimals} \\
raw(user\_ratio) & = & user\_ratio / 10^{outbound\_decimals - inbound\_decimals} \\
userRepresentation(raw\_price) & = & raw\_price * 10^{base\_decimals - quote\_decimals} \\
raw(user\_price) & = & user\_price / 10^{base\_decimals - quote\_decimals}
\end{array}
$$

## Converting a price to a tick

Since the price space is discretized, not all prices and ratios can be represented exactly. Converting a price or ratio to a tick may therefore require rounding and one should take care to round appropriately; We'll discuss this in detail below.

First, calculate an exact but possibly non-representable `tick'` which may have a real component:

$$
\begin{array}{rcl}
tick'_{side \in \{asks, bids\}}(price) & = & \begin{cases}
   log_{1.0001}(price) &\text{if } side \equiv asks \\
   -log_{1.0001}(price) &\text{if } side \equiv bids.
\end{cases} \\ \\
tick'(ratio) & = & log_{1.0001}(ratio)
\end{array}
$$

Next, round this value to an integer to get a representable tick. One will typically want to round down or up depending on whether the price or ratio is used in a maker or taker context:

| Role  | Tick rounding | Explanation                                                                                                                                                                                                                                                                                                            |
| ----- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Taker | Round down    | Takers specify a max price when buying and min price when selling. In both cases, this price corresponds to a _max_ ratio they're willing to accept. Rounding down the tick corresponds to choosing the tick closest to but not exceeding that ratio. This ensures the taker doesn't get a worse price than specified. |
| Maker | Round up      | Makers specify the price they're willing to accept. This price corresponds to a ratio as discussed above. Rounding up the tick corresponds to choosing the tick closest to but not below that ratio. This ensures the maker doesn't receive too little.                                                                |

## `tickSpacing`: Markets with bigger price increments

Mangrove allows markets to require bigger price increments than 0.01%. This is achieved through use of the `tickSpacing` parameter which restricts the allowed ticks to multiples of `tickSpacing`: Only ticks where `tick % tickSpacing == 0` are valid on a market.

This means that the price increments are $$1.0001tickSpacing−11.0001tickSpacing−1$$.

**Example :**\
For a market with `tickSpacing = 5`, the allowed ticks are `..., -15, -10, -5, 0, 5, 10, 15, ...` and the price increments are $$1.00015−1=0.0005001=0,05001%1.00015−1=0.0005001=0,05001%$$.

## Tick, ratio, and price ranges

The supported ranges for ticks, ratios, and prices in Mangrove are:

| Value | Min     | Max    |
| ----- | ------- | ------ |
| Tick  | -887272 | 887272 |
| Ratio | 2.9e-39 | 3.4e38 |
| Price | 2.9e-39 | 3.4e38 |

## The TickLib library

The [`TickLib`](https://github.com/mangrovedao/mangrove-core/blob/2ae172805fd8b309c30b2dc877dba66245abbb3e/lib/core/TickLib.sol) library contains utility functions for converting between ticks and ratios.

It also contains functions for calculations involving ticks and ratios, such as computing the inbound volume corresponding to a tick and outbound volume.

## Comparison to Uniswap ticks

Mangrove's ticks are inspired by Uniswap’s tick, with the following notable differences:

* Directly computing ticks base 1.0001 (not base `sqrt(1.0001)`)
* Directly computing ratios (not `sqrt(ratio)` - it makes the code simpler when dealing with actual ratios and logs of ratios)
* Ratios are floating-point numbers, not fixed-point numbers (it increases the precision when computing amounts).
