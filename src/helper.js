export const chunkArray = (arr, n) => {
    return arr.reduce(function (p, c, i) {
        if (i % n === 0) p.push([])
        p[p.length - 1].push(c)
        return p
    }, [])
}

export const dateParser = input => {
    const parts = input.match(/(\d+)/g);
    return new Date(parts[2], parts[1] - 1, parts[0]);
}
