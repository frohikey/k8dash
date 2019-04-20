import _ from 'lodash';
import React from 'react';
import Chart from './chart';
import LoadingChart from './loadingChart';
import {parseRam, TO_GB} from '../utils/unitHelpers';
import {getRamRequestFlag} from '../utils/itemHelpers';

export default function RamChart({items, metrics}) {
    const totals = getPodRamTotals(items, metrics);
    const decimals = totals && totals.used > 10 ? 1 : 2;
    const defined = items ? !_(items).every(x => !getRamRequestFlag(x)) : true;

    return (
        <div className='charts_item'>
            {totals ? (
                <Chart
                    decimals={decimals}
                    used={totals && totals.used}
                    usedSuffix='Gb'
                    available={totals && totals.available}
                    availableSuffix='Gb'
                    defined={defined}
                />
            ) : (
                <LoadingChart />
            )}
            <div className='charts_itemLabel'>Pod Ram Use</div>
            <div className='charts_itemSubLabel'>Actual vs Reserved</div>
        </div>
    );
}

export function getPodRamTotals(items, metrics) {
    if (!items || !metrics) return null;

    const used = _(metrics)
        .flatMap(x => x.containers)
        .sumBy(x => parseRam(x.usage.memory));

    const available = _(items)
        .flatMap(x => x.spec.containers)
        .filter(x => x.resources && x.resources.requests && x.resources.requests.memory)
        .sumBy(x => parseRam(x.resources.requests.memory));

    const namesWithoutResources = _(items)
        .flatMap(x => x.spec.containers)
        .filter(x => !x.resources || !x.resources.requests || !x.resources.requests.memory)
        .map(x => x.name);

    const availablePlus = _(metrics)
        .flatMap(x => x.containers)
        .filter(x => namesWithoutResources.includes(x.name))
        .sumBy(x => parseRam(x.usage.memory));

    return {
        used: used / TO_GB,
        available: (available + availablePlus) / TO_GB,
    };
}
