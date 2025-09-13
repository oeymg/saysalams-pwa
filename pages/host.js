// pages/host.js

import Link from 'next/link';
import Image from 'next/image';
import Layout from '../components/layout.js';
import Collapsible from '../components/Collapsible';

export async function getServerSideProps() {
  return { redirect: { destination: '/partners', permanent: false } };
}

export default function Host() { return null; }
