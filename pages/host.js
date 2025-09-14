// pages/host.js

export async function getServerSideProps() {
  return { redirect: { destination: '/partners', permanent: false } };
}

export default function Host() { return null; }
