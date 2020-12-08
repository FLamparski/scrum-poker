import { Nuxt } from 'nuxt-start';
import config from './nuxt.config';

const nuxt = new Nuxt({ ...config, dev: false });

export default async function (req, res) {
    await nuxt.ready();
    nuxt.server.app(req, res);
}
