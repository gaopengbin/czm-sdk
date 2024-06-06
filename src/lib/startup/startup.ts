
export const init = async () => {
    const { earth, widgets } = await fetch('configs/config.json', {
        method: 'GET',
        headers: {
            'Cache-Control': 'no-cache'
        }
    }).then(response => response.json());

    return { earth, widgets };
}