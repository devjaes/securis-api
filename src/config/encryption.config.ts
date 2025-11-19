import { registerAs } from '@nestjs/config';

export default registerAs('encryption', () => ({
  huffmanTreeBack: process.env.HUFFMAN_TREE_BACK_PATH!,
  huffmanTreeDb: process.env.HUFFMAN_TREE_DB_PATH!,
}));
