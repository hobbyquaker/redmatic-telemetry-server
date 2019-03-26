$(document).ready(() => {
    $.getJSON('data', (data, success) => {

        $('#total').html(data.total);

        data.nodes.forEach(node => {
            const [name, count] = node;
            $('#nodes').append(`<tr><td>${name}</td><td>${count}</td></tr>`);
        });

        function labelFormatter(label, series) {
            return "<div style='font-size:10pt; text-align:center; padding:2px; color:black;'>" + label + "<br/>" + Math.round(series.percent) + "%</div>";
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
