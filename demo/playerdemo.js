
class PlayerDemo {
    constructor() {
        this.playerContainer = document.getElementById('player-container');
        this.player = new window.DHARA.Player(this.playerContainer);

        // For easier debugging & testing.
        window.dp  = this.player;
        window.dpe = this.player.element();
    }

    selectSample(id) {
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set('sample', id);
        window.location.assign(nextUrl.toString());
    }

    loadSource(sample) {
        const defaultSample = 'single-period';

        const sources = {
            'audio-only': 'https://livesim2.dashif.org/vod/testpic_2s/audio.mpd',
            'single-period': 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd',
            'multi-period': 'https://dash.akamaized.net/dash264/TestCases/5a/nomor/1.mpd',
        };

        const url = sources[sample ?? defaultSample];
        if (!url) return;

        this.player.setSource(new URL(url));
    }
}

window.PlayerDemo = new PlayerDemo();
const sampleParam = new URLSearchParams(window.location.search).get('sample');
window.PlayerDemo.loadSource(sampleParam);
