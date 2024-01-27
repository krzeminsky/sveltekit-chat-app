export function formatRelativeDate(timestamp: number) {
    const timestampDate = new Date(timestamp);
    const todaysDate = new Date();

    const sameWeek = todaysDate.getUTCMilliseconds() - 604_800_000 < timestamp; // ? magic number is week in ms

    if (timestampDate.getDate() == todaysDate.getDate()) return timestampDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    else if (timestampDate.getDate() + 1 == todaysDate.getDate()) return `Yesterday ${timestampDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;

    return timestampDate.toLocaleString('en-uk', {
        year: todaysDate.getUTCFullYear() == timestampDate.getUTCFullYear()? undefined : 'numeric',
        month: sameWeek? undefined : 'long',
        day: sameWeek? undefined : 'numeric',
        weekday: sameWeek? 'long' : undefined,
        hour: '2-digit',
        minute: '2-digit'
    });
}