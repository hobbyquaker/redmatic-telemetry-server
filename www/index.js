$(document).ready(() => {
    $.getJSON('data', (data, success) => {

        $('#total').html(data.total);



        data.versions.forEach(node => {
            const [name, count] = node;
            let percent = Math.round(100 * count / data.total);
            $('#redmatic-versions-table').append(`<tr><td>${name}</td><td class="count">${count}</td><td class="count">(${percent}%)</td></tr>`);
        });

        data.products.forEach(node => {
            const [name, count] = node;
            let percent = Math.round(100 * count / data.total);
            $('#ccu-products-table').append(`<tr><td>${name}</td><td class="count">${count}</td><td class="count">(${percent}%)</td></tr>`);
        });

        data.nodes.forEach(node => {
            const [name, count] = node;
            let percent = Math.round(100 * count / data.total);
            $('#nodes').append(`<tr><td>${name}</td><td class="count">${count}</td><td class="count">(${percent}%)</td></tr>`);
        });

        data.ccuVersions.forEach(v => {
            const [name, count] = v;
            let percent = Math.round(100 * count / data.total);
            $('#ccu-versions-table').append(`<tr><td>${name}</td><td class="count">${count}</td><td class="count">(${percent}%)</td></tr>`);
        });

        data.platforms.forEach(v => {
            const [name, count] = v;
            let percent = Math.round(100 * count / data.total);
            $('#ccu-platforms-table').append(`<tr><td>${name}</td><td class="count">${count}</td><td class="count">(${percent}%)</td></tr>`);
        });

        function labelFormatter(label, series) {
            return "<div style='font-size:8pt; text-align:center; padding:2px; color:black;'>" + label + "<br/>" + Math.round(series.percent) + "%</div>";
        }

        const pieConfig = {
            series: {
                pie: {
                    show: true,
                    label: {
                        formatter: labelFormatter,
                        background: {
                            opacity: 0.6
                        }
                    }
                }
            }
        };

        $.plot("#redmatic-versions", data.versions.map(a => {return {label: a[0], data: a[1]}}), pieConfig);

        $.plot("#ccu-versions", data.ccuVersions.map(a => {return {label: a[0], data: a[1]}}), pieConfig);

        $.plot("#ccu-platforms", data.platforms.map(a => {return {label: a[0], data: a[1]}}), pieConfig);

    });
});
