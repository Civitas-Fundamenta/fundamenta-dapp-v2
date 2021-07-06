import $ from 'jquery'

export function hide(element) {
    $(element).addClass('d-none');
}

export function disable(element) {
    $(element).addClass('disable');
    $(element).prop("disabled", true);

    $(element).find('*').addClass('disable');
    $(element).find('*').prop("disabled", true);
}

export function show(element) {
    $(element).removeClass('d-none');
}

export function enable(element) {
    $(element).removeClass('disable');
    $(element).prop("disabled", false);

    $(element).find('*').removeClass('disable');
    $(element).find('*').prop("disabled", false);
}
