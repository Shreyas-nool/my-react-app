import { HashLoader } from 'react-spinners';

const Loader = () => {
	return (
		<div className='flex min-h-96 items-center justify-center'>
			<HashLoader color='#4338ca' size={50} />
		</div>
	);
};

export default Loader;
