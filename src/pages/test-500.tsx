export async function getServerSideProps() {
  throw new Error('Test server error');
  
  return {
    props: {}
  };
}

export default function TestPage() {
  return <div>This page will never render</div>;
}